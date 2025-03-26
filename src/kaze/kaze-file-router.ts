import { DynamicRoute, Router } from "./kaze-router";
import { KazeRouteHandler, KazeHttpMethod } from "./kaze";
import { MapRouter } from "./kaze-map-router";
import path from "node:path";
import fs from "node:fs/promises";

type FileRouteInfo = {
    path: string,
    type: "normal" | "dynamic-param";
}

export class FileRouter extends Router {

    #mapRouter = new MapRouter();
    #lazyDynamicLoadFileMap = new Map<string, string>();
    #routerDirPath: string = path.join(process.cwd(), "routes");

    constructor() {
        super()
        
        this.indexDirectoryRoutes(this.#routerDirPath, {
            path: this.#routerDirPath,
            type: "normal"
        });
    }

    async #getMiddlewareAt(
        middlewarePath: string
    ): Promise<KazeRouteHandler[]> {
        try {
            await fs.access(middlewarePath, fs.constants.R_OK);
        
            const middlewareFns = await this.#importOrRequire(middlewarePath);
            return Object.values(middlewareFns);
        } catch {};

        return [];
    }

    async indexDirectoryRoutes(rootDir: string, pathInfo: FileRouteInfo) {
        try {

            const dirs = await fs.readdir(rootDir);
            
            for(const dir of dirs) {
                const fullpath = path.join(rootDir, dir);
                
                const info = await fs.stat(fullpath);
            
                if(
                    info.isDirectory()
                ) {
                    
                    if(dir.startsWith("[")){                
                        if(dir.includes("@")) {
                            throw new Error(`Invalid route name: ${dir}`);
                        }
                        await this.indexDirectoryRoutes(fullpath, {
                            path: fullpath,
                            type: "dynamic-param"
                        });
                    } else {
                        await this.indexDirectoryRoutes(fullpath, {
                            path: fullpath,
                            type: "normal"
                        });
                    }
                } else if(
                    info.isFile() && (path.basename(fullpath) === "route.ts" || path.basename(fullpath) === "route.js")
                ) {
                     
                    let routeCode: any = {};

                    routeCode = await this.#importOrRequire(fullpath);
                    
                    let route = fullpath.replace(this.#routerDirPath, "")
                        .replaceAll("\\", "/")
                        .replace(/route\.(?:ts|js)$/, "");

                    
                    route =  route.length > 1 ? route.replace(/\/$/, "") : route;
                    
                    route = route.replaceAll(/\/\(.*?\)/g, '');
        
                    const middlewareFns: KazeRouteHandler[] = [];
                    if(pathInfo.type === "dynamic-param") {
                        route = route.replaceAll(/\[([^\]]+)\]/g, ':$1');
                    } else if(route.includes("/@")) {        
                        const regex = /\/@[\w]+/g;
                        const dyns = route.matchAll(regex).map(dyn => dyn[0]);
                        route = route.replaceAll(regex, '/*');

                        for(const dyn of dyns) {
                            const pathFix = path.join(dyn, "");
                            const dynPath = path.join(fullpath.split(pathFix)[0], dyn, "middleware");
                            
                            let middlewares = await this.#getMiddlewareAt(dynPath + ".js");
                            if(middlewares.length === 0) {
                                middlewares = await this.#getMiddlewareAt(dynPath + ".ts");
                            }
                            
                            middlewareFns.push(...middlewares);
                        }
                    }
                    
                    const middlewarePath: string = fullpath.replace(/route\.(ts|js)$/, 'middleware.$1');
                    
                    if(!route.includes("/*")) {
                        const middlewares = await this.#getMiddlewareAt(middlewarePath);
                        middlewareFns.push(...middlewares);
                    }

                    for(const methodName in routeCode) {
                        if(methodName === "default") continue;
                        
                        (this.#mapRouter as any)[methodName.toLowerCase()](route, ...middlewareFns, routeCode[methodName]);
                    }
                }
            }
        } catch {   
            throw new Error(`Dir Read Error: Directory ${this.#routerDirPath}.`);
        }
    }

    get(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    post(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    put(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    delete(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    patch(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    head(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    options(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    trace(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    connect(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    link(route: string, ...handlers: KazeRouteHandler[]): void {
    }
    unlink(route: string, ...handlers: KazeRouteHandler[]): void {
    }

    all(route: string, ...handlers: KazeRouteHandler[]): void {
    }

    middlewares(...handlers: KazeRouteHandler[]): void {
    }

    // continue working on lazy load file
    async #importOrRequire(path: string) {
        try {
            return await import(path);
        } catch {
            return require(path);
        }
    };

    fetchMiddlewares(): KazeRouteHandler[] {
        return this.#mapRouter.fetchMiddlewares();
    }

    async fetchHandlers(route: string, reqMethod: KazeHttpMethod): Promise<KazeRouteHandler[] | DynamicRoute | undefined> {
        route = (route.length > 1 && route.endsWith("/")) ? route.slice(0, -1) : route;

        const fullpath = this.#lazyDynamicLoadFileMap.get(route);
        
        if(!fullpath) {
            return this.#mapRouter.fetchHandlers(route, reqMethod);
        }
        
        const middlewarePath = this.#lazyDynamicLoadFileMap.get(`m-${route}`);
        let middlewareCode: any = [];

        if (middlewarePath) {
            const middleware = await this.#importOrRequire(middlewarePath);
            middlewareCode = middleware ? Object.values(middleware) : [];
        }
        
        const routeCode = await this.#importOrRequire(fullpath);

        return [...middlewareCode, routeCode[reqMethod.toUpperCase()]];
    }

}