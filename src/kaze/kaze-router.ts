import { KazeRouteHandler, KazeHttpMethod, RouteMap, DynamicRouteMap } from "./kaze";

export type DynamicRouteInfo = {
    dynSeg: string[],
    normSeg: string[],
    fullRoute: string,
    handlers: KazeRouteHandler[],
}

export type DynamicRoute = {
    params: Record<string, string>,
    handlers: KazeRouteHandler[]
}

export interface HttpMethods {
   get(route: string, ...handlers: KazeRouteHandler[]): void;
   post(route: string, ...handlers: KazeRouteHandler[]): void;
   put(route: string, ...handlers: KazeRouteHandler[]): void;
   delete(route: string, ...handlers: KazeRouteHandler[]): void;
   patch(route: string, ...handlers: KazeRouteHandler[]): void;
   head(route: string, ...handlers: KazeRouteHandler[]): void;
   options(route: string, ...handlers: KazeRouteHandler[]): void;
   trace(route: string, ...handlers: KazeRouteHandler[]): void;
   connect(route: string, ...handlers: KazeRouteHandler[]): void;
   link(route: string, ...handlers: KazeRouteHandler[]): void;
   unlink(route: string, ...handlers: KazeRouteHandler[]): void;
   all(route: string, ...handlers: KazeRouteHandler[]): void;
}

export abstract class Router implements HttpMethods {
    abstract get(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract post(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract put(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract delete(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract patch(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract head(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract options(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract trace(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract connect(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract link(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract unlink(route: string, ...handlers: KazeRouteHandler[]): void;
    abstract all(route: string, ...handlers: KazeRouteHandler[]): void;

    abstract middlewares(...handlers: KazeRouteHandler[]): void;
    abstract fetchMiddlewares(): KazeRouteHandler[];

    abstract fetchHandlers(
        route: string,
        reqMethod: KazeHttpMethod,
    ): KazeRouteHandler[] | DynamicRoute | undefined;
}

export type DerivedRouters = new () => Router;