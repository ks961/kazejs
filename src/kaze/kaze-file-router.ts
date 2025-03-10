import { DynamicRoute, Router } from "./kaze-router";
import { KazeRouteHandler, KazeHttpMethod } from "./kaze";
import { MapRouter } from "./kaze-map-router";
import path from "node:path";
import fs from "node:fs/promises";

type FileRouteInfo = {
    path: string,
    type: "normal" | "dynamic"
}

export class FileRouter extends Router {

    #mapRouter = new MapRouter();
    #routerDirPath: string = path.join(process.cwd(), "routes");

    constructor() {
        super()
        
        this.indexDirectoryRoutes(this.#routerDirPath, {
            path: this.#routerDirPath,
            type: "normal"
        });
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
                        await this.indexDirectoryRoutes(fullpath, {
                            path: fullpath,
                            type: "dynamic"
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
                    try {
                        routeCode = await import(fullpath);
                    } catch {
                        routeCode = require(fullpath);
                    }

                    let route = fullpath.replace(this.#routerDirPath, "").replaceAll("\\", "/").replace("/route.ts", "");
                    
                    route = route.replaceAll(/\/\(.*?\)/g, '');
        
                    if(pathInfo.type === "dynamic") {
                        route = route.replaceAll(/\[([^\]]+)\]/g, ':$1');
                    } else if(route.includes("/#")) {                       
                        route = route.replaceAll("/#", '/*');
                    }
        
                    let middlewareModule = {};
                    const middlewarePath = fullpath.replace("route.ts", "middleware.ts");
    
                    try {
                        await fs.access(middlewarePath, fs.constants.R_OK);
                        middlewareModule = await import(middlewarePath);
                    } catch {
                        middlewareModule = require(middlewarePath);
                    }
            
                    const middlewareFns = Object.keys(middlewareModule).reduce((acc, key) => {
                        acc.push((middlewareModule as any)[key]);
                        return acc;
                    }, [] as KazeRouteHandler[]);
        
                    for(const methodName in routeCode) {
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

    fetchMiddlewares(): KazeRouteHandler[] {
        return this.#mapRouter.fetchMiddlewares();
    }

    fetchHandlers(route: string, reqMethod: KazeHttpMethod): KazeRouteHandler[] | DynamicRoute | undefined {
        return this.#mapRouter.fetchHandlers(route, reqMethod);
    }

}