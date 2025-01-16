import http from "http";
import path from "path";
import fs from "fs/promises";
import { readdirSync, readFileSync, statSync } from "fs";
import { getMimeType } from "@d3vtool/utils";
import { MapRouter } from "./kaze-map-router";
import { DerivedRouters, DynamicRoute, DynamicRouteInfo, HttpMethods, Router } from "./kaze-router";
import { transformErrorStackToHtml } from "./kaze-utils";
import { KazeRouteError, KazeRouteNotFound, KazeValidationError } from "./kaze-errors";
import { Cookie, CookieOptions, createCookie, parseCookies } from "./kaze-cookies";
import { fileUpload, FileUploadOptions, KazeFile } from "./kaze-fileupload";
import { parseBody } from "./kaze-body";

interface KazeRequest<Query, Params, Body> extends http.IncomingMessage {
    secure: boolean,
    cookies?: Cookie,
    query?: Partial<Query>,
    params?: Partial<Params>,
    body?: Body,
    files?: KazeFile[]
}

interface KazeResponse extends Omit<http.ServerResponse, "statusCode" | "setHeader"> {
    send: (data: string) => void;
    statusCode: (code: number) => void;
    html: (htmlSource: string) => void;
    json: (jsonObj: Record<any, any>) => void;
    sendFile: (path: string) => Promise<void>;
    setHeader: (
        key: keyof http.IncomingHttpHeaders, 
        value: string | string[]
    ) => void;

    addHeader: (
        key: keyof http.IncomingHttpHeaders, 
        value: string | string[]
    ) => void;

    setCookie: (
        key: string,
        value: string,
        options: CookieOptions
    ) => void;
}

export interface KazeContext<
    KazeDependencies = any, 
    Query = any, 
    Params = any,
    Body = any
> {
    req: KazeRequest<Query, Params, Body>,
    res: KazeResponse
    dependencies?: KazeDependencies
}

export type KazeHttpMethod = 
    "GET"    | 
    "POST"   |
    "PUT"    |
    "HEAD"   |
    "PATCH"  |
    "DELETE" |
    "TRACE"  |
    "OPTIONS"|
    "CONNECT"|
    "LINK"   |
    "UNLINK"


export type KazeRoute = string;

export type KazeNextFunction = () => void;

export type KazeRouteHandler = 
    (ctx: KazeContext<any>, next: KazeNextFunction) => void | Promise<void>;

export type RouteMap = Map<KazeRoute, KazeRouteHandler[]>;

export type DynamicSegmentLength = number;
export type DynamicRouteMap = Map<DynamicSegmentLength, DynamicRouteInfo>;

export type RequestHandle = 
    (request: http.IncomingMessage, response: http.ServerResponse) => void;

type ErrorHandlerFn = (ctx: KazeContext<any>, error: unknown) => void | Promise<void>;
type ValidationFailedFn = (ctx: KazeContext<any>, error: KazeValidationError) => void | Promise<void>;

export const AcceptedMethods: Set<KazeHttpMethod> = new Set([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "TRACE",
    "OPTIONS",
    "CONNECT",
    "LINK",
    "UNLINK",
]);

export type StaticFile = {
    data: Buffer,
    mimeType: ReturnType<typeof getMimeType>;
}

export type KazeOptions<KazeDependencies> = {
    router?: DerivedRouters,
    dependencies?: KazeDependencies
}

export class Kaze<KazeDependencies> implements HttpMethods {
    #router: Router;
    #isHttps: boolean;
    #port: number = 8657;
    #server: http.Server;
    #contentLength: number = 0;
    #mimeType: string = "text/plain";
    #respStatusCode: number = 200;
    #responseData: string | Buffer = "";
    #responseSent: boolean = false;
    #errorHandler: ErrorHandlerFn;
    #validationFailedHandler: ValidationFailedFn;
    #httpResponseHeaders: http.IncomingHttpHeaders;
    #staticDirPath: string = "";
    #staticFileMap = new Map<string, StaticFile>();
    #globalMiddlewares = new Set<KazeRouteHandler>();

    static routerClass: DerivedRouters;
    
    constructor(options?: KazeOptions<KazeDependencies>) {

        Kaze.routerClass = options?.router ?? MapRouter;

        if (typeof Kaze.routerClass !== 'function') {
            throw new Error('Invalid router class');
        }

        this.#router = new Kaze.routerClass();
        
        this.#httpResponseHeaders = {};

        this.#isHttps = false;

        this.#errorHandler = this.#defaultErrorHandler;
        this.#validationFailedHandler = this.#defaultVFailedHandler;

        this.#server = http.createServer((
            req: http.IncomingMessage, 
            res: http.ServerResponse
        ) => {
            this.#handle(req, res, options?.dependencies);
        });
    }

    static Router(router: DerivedRouters = MapRouter): Router {
        return new router();
    }

    static parseCookie(): typeof parseCookies {
        return parseCookies;
    }

    static parseBody(): ReturnType<typeof parseBody> {
        return parseBody();
    }

    static fileUpload(options?: FileUploadOptions): ReturnType<typeof fileUpload> {
        return fileUpload(options);
    }

    #loadStaticDirFiles(dirPath: string) {
        const dirListing = readdirSync(dirPath);
        for(const item of dirListing) {
            const fullPath = path.join(dirPath, item);
            const itemStat = statSync(fullPath);
            if(itemStat.isFile()) {
                const data = readFileSync(fullPath);
                const filePath = fullPath.replace(
                    path.normalize(`${this.#staticDirPath}/`), 
                    ""
                ); // removing the static dir name

                this.#staticFileMap.set(filePath, {
                    data,
                    mimeType: getMimeType(item.split(".")[1])
                });
            } else if(itemStat.isDirectory()) {
                this.#loadStaticDirFiles(path.join(dirPath, item));
            }
        }
    }

    static(dirPath: string) {
        this.#staticDirPath = dirPath;
        this.#loadStaticDirFiles(dirPath);
    }

    addGlobalMiddleware(middleware: KazeRouteHandler | KazeRouteHandler[]) {
        if(Array.isArray(middleware)) {
            middleware.forEach(mdWare => {
                this.#globalMiddlewares.add(mdWare);
            });
        } else {
            this.#globalMiddlewares.add(middleware);
        }
    }

    globalErrorHandler(fn: ErrorHandlerFn) {
        this.#errorHandler = fn;
    }

    globalVErrorHandler(fn: ValidationFailedFn) {
        this.#validationFailedHandler = fn;
    }

    #defaultErrorHandler(ctx: KazeContext<any>, error: unknown) {        
        ctx.res.statusCode(500);
        if(error instanceof Error) {
            ctx.res.html(
                transformErrorStackToHtml(error.stack ?? error.message)
            );
        }
    }

    #defaultVFailedHandler(
        ctx: KazeContext<any>, 
        error: KazeValidationError
    ) {
        const errors = error.vErrors;
        ctx.res.send(JSON.stringify(errors));
    }

    get(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.get(route, ...reqHandler);
    }

    post(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.post(route, ...reqHandler);
    }

    put(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.put(route, ...reqHandler);
    }

    delete(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.delete(route, ...reqHandler);
    }

    patch(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.patch(route, ...reqHandler);
    }

    head(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.head(route, ...reqHandler);
    }

    options(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.options(route, ...reqHandler);
    }

    trace(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.trace(route, ...reqHandler);
    }

    connect(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.connect(route, ...reqHandler);
    }

    link(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.link(route, ...reqHandler);
    }

    unlink(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.unlink(route, ...reqHandler);
    }

    all(route: KazeRoute, ...reqHandler: KazeRouteHandler[]) {
        this.#router.all(route, ...reqHandler);
    }

    routeGrp(pRoute: KazeRoute, routes: Router) {
        AcceptedMethods.forEach(method => {
            if(routes instanceof MapRouter) {
                this.#appendToMapRouter(method, pRoute, routes);
            }
        });
    }

    #appendToMapRouter(
        method: KazeHttpMethod,
        pRoute: KazeRoute, 
        routes: MapRouter
    ) {
        const normalRoutes = routes.fetchRoutes();
        normalRoutes.get(method)?.forEach((
            handlers: KazeRouteHandler[], 
            route: KazeRoute
        ) => {
            const fullRoute = route !== "/" ? `${pRoute}${route}` : pRoute; 
            this.#router[method.toLowerCase() as keyof HttpMethods](fullRoute, ...handlers)
        });

        const dynamicRoutes = routes.fetchDynamicRoutes();
        dynamicRoutes.get(method)?.forEach((
            dynRouteInfo: DynamicRouteInfo,
            _: DynamicSegmentLength
        ) => {
            const fullRoute = dynRouteInfo.fullRoute !== "/" ? `${pRoute}${dynRouteInfo.fullRoute}` : pRoute;
            this.#router[method.toLowerCase() as keyof HttpMethods](fullRoute, ...dynRouteInfo.handlers)
        });
    }

    // will overwrite the header on multiple calls with same key
    #setHeader(
        key: keyof http.IncomingHttpHeaders, 
        value: string | string[],
    ) {
        this.#httpResponseHeaders[key] = value;
    }

    async #sendFile(path: string): Promise<void> {
        const extension = path.split("/").pop()?.split(".")[1];

        this.#mimeType = getMimeType(extension!)

        const body = await fs.readFile(path, {encoding: "utf8"});
        
        this.#contentLength = Buffer.byteLength(body);
        this.#responseData = body;
    }
    
    #send(data: string) {
        this.#mimeType = "text/plain";
        this.#contentLength = Buffer.byteLength(data);
        this.#responseData = data;
    }
    
    #html(htmlSource: string) {
        this.#mimeType = "text/html";
        this.#contentLength = Buffer.byteLength(htmlSource);
        this.#responseData = htmlSource;
    }
    
    #json(jsonObj: unknown) {
        this.#mimeType = "application/json";

        const data = JSON.stringify(jsonObj);
        this.#contentLength = Buffer.byteLength(data);
        this.#responseData = data;
    }

    #statusCode(code: number) {
        this.#respStatusCode = code;
    }

    #handleResponse(res: http.ServerResponse) {
        
        if(this.#responseSent || res.closed) {
            throw new Error("Trying to send more than one response");
        }
        
        const respHeaders = {
            "content-type": this.#mimeType,
            "content-length": this.#contentLength,
            ...this.#httpResponseHeaders
        }
        
        res.writeHead(
            this.#respStatusCode,
            respHeaders
        ).end(this.#responseData);

        this.#responseSent = true;
    }

    getHandle(isHttps: boolean): RequestHandle {
        this.#isHttps = isHttps;
        return this.#handle.bind(this);
    }

    #handleStaticFile(filePath: string, response: http.ServerResponse) {
        const staticFile = this.#staticFileMap.get(filePath)!;

        this.#statusCode(200);
        this.#mimeType = staticFile.mimeType;
        this.#responseData = staticFile.data;
        this.#contentLength = Buffer.byteLength(staticFile.data);

        this.#handleResponse(response);
    }

    #handle(
        request: http.IncomingMessage, 
        response: http.ServerResponse,
        dependencies?: KazeDependencies
    ) {
        const [route, queries] = request.url?.split("?")!;
        const reqMethod = request.method as KazeHttpMethod;
        
        // before any new request is served
        this.#resetServerState();

        const routes = route.split("/").slice(1);
        const filePath = path.join(...routes);

        if ((reqMethod === "GET" || reqMethod === "HEAD") && this.#staticFileMap.has(filePath)) {            
            this.#handleStaticFile(filePath, response);            
            return;
        }

        try {

            if(!reqMethod || !route) {
                throw new Error("reqMethod or Route is missing in incoming request.");
            }
            
            let params: Record<string, string> = {};
            let routeHandlers = this.#router.fetchHandlers(route, reqMethod);

            if(
                typeof routeHandlers === "object" && 
                routeHandlers.hasOwnProperty("params")
            ) {
                params = (routeHandlers as DynamicRoute)["params"];
                routeHandlers = (routeHandlers as DynamicRoute)["handlers"];
            }
            
            if(routeHandlers === undefined) {
                routeHandlers = this.#router.fetchHandlers("*", reqMethod);
                
                if(routeHandlers === undefined) {
                    throw new KazeRouteNotFound(`Route '${route}' not found.`);
                }
            }

            const queriesMap = queries?.split("&").reduce((acc, query) => {
                const [ key, value ] = query.split("=");
                acc[key] = value;
                
                return acc;
            }, {} as Record<string, string>);

            const ctx: KazeContext<KazeDependencies> = {
                dependencies,
                req: Object.assign(request, {
                    params: params,
                    query: queriesMap,
                    secure: this.#isHttps,
                }),
                
                res: Object.assign(response, {
                    send: (data: string) => {
                        this.#send(data);
                        this.#handleResponse(response);
                    },
                    json: (jsonObj: unknown) => {
                        this.#json(jsonObj);
                        this.#handleResponse(response);
                    },
                    html: (htmlSource: string) => {
                        this.#html(htmlSource);
                        this.#handleResponse(response);
                    },
                    sendFile: async(path: string) => {
                        await this.#sendFile(path);
                        this.#handleResponse(response);
                    },
                    setHeader: this.#setHeader.bind(this),
                    statusCode: this.#statusCode.bind(this),
                    addHeader: (
                        key: keyof http.IncomingHttpHeaders, 
                        value: string | string[]
                    ) => {
                        response.setHeader(key as string, value);
                    },
                    setCookie: (
                        key: string, 
                        value: string, 
                        options: CookieOptions
                    ) => {
                        const cookie = createCookie(key, value, options);
                        response.setHeader("Set-Cookie", cookie);
                    }
                }),
            }

            const allHandlers = [
                ...this.#globalMiddlewares, 
                ...routeHandlers as KazeRouteHandler[],
            ];

            function* handlerGen() {
                for(let i = 0; i < allHandlers.length; ++i) {
                    yield allHandlers[i];
                }
            }

            const hGen = handlerGen();

            const next = async() => {
                let result = hGen.next();
                if(!result.done) {
                    const handler = result.value;
                    try {
                        
                        await handler(ctx, next);

                    } catch(err: unknown) {

                        if(err instanceof KazeValidationError) {
                            this.#validationFailedHandler(
                                ctx,
                                err
                            );
                        } else {
                            this.#errorHandler(ctx, err);
                        }
                    }
                }
            }

            next();

        } catch(err: unknown) {

            if(
                err instanceof KazeRouteError ||
                err instanceof KazeRouteNotFound
            ) {
                this.#statusCode(err.statusCode);
                this.#responseData = transformErrorStackToHtml(err.stack!);
            } else if(err instanceof Error) {
                this.#statusCode(500);
                this.#responseData = transformErrorStackToHtml(err.stack!);
            }
            this.#mimeType = "text/html";
            this.#contentLength = Buffer.byteLength(this.#responseData);
            this.#handleResponse(response);
        }
    }


    #resetServerState() {
        this.#statusCode(200);
        this.#mimeType = "text/plain";
        this.#contentLength = 0;
        this.#responseData = "";
        this.#responseSent = false;
        this.#httpResponseHeaders = {};
    }

    listen(
        port: number,
        listeningListener?: VoidFunction
    ) {

        this.#port = port;
        this.#server.listen(this.#port, listeningListener);
    }
};