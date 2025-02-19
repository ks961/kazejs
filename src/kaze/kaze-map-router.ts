import { 
    RouteMap,
    KazeRoute,
    KazeHttpMethod,
    AcceptedMethods,
    KazeRouteHandler,
    DynamicRouteMap,
    DynamicSegmentLength,
} from "./kaze";
import { DynamicRoute, DynamicRouteInfo, Router } from "./kaze-router";

type DynRouteSegments = {
    normalSeg: string[],
    routeSegments: string[],
    dynamicRouteSeg: string[]
}

export class MapRouter extends Router {

    #routeMap: Map<KazeHttpMethod, RouteMap> = new Map<KazeHttpMethod, RouteMap>();
    
    #dynamicRouteMap: Map<KazeHttpMethod, DynamicRouteMap> = 
        new Map<KazeHttpMethod, DynamicRouteMap>();

    constructor() {
        super();
        AcceptedMethods.forEach(method => {
            this.#routeMap.set(
                method, 
                new Map<KazeRoute, KazeRouteHandler[]>()
            );
            this.#dynamicRouteMap.set(
                method,
                new Map<DynamicSegmentLength, DynamicRouteInfo>()
            )
        });
    }

    #genRouteSegment(route: string): DynRouteSegments {
        const routeSegments = route.split("/");
        const dynamicRouteSeg = routeSegments.reduce((acc, seg) => {
            seg.startsWith(":") ? acc.push(seg.substring(1,)) : acc

            return acc;
        }, [] as string[]);
                    
        const dynSegStartIdx = routeSegments.length - dynamicRouteSeg.length;
        const normalSeg = routeSegments.slice(0, dynSegStartIdx);
        
        return {
            normalSeg,
            routeSegments,
            dynamicRouteSeg,
        }
    }
    
    get(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:") || route.includes("/*");

        if(!isDynamicRoute) {
            this.#routeMap.get("GET")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);

        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("GET")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }
    
    post(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("POST")?.set(route, handlers);
            return;
        }
        
        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("POST")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    put(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("PUT")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("PUT")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    delete(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("DELETE")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("DELETE")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    patch(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("PATCH")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("PATCH")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    head(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("HEAD")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("HEAD")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    options(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("OPTIONS")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("OPTIONS")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    trace(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("TRACE")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("TRACE")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    connect(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("CONNECT")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("CONNECT")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    link(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("LINK")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("LINK")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    unlink(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        if(!isDynamicRoute) {
            this.#routeMap.get("UNLINK")?.set(route, handlers);
            return;
        }

        const dynRouteSeg = this.#genRouteSegment(route);
        const dynRouteInfo: DynamicRouteInfo = {
            dynSeg: dynRouteSeg.dynamicRouteSeg,
            normSeg: dynRouteSeg.normalSeg,
            fullRoute: route,
            handlers
        }
        this.#dynamicRouteMap.get("UNLINK")?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
    }

    all(route: string, ...handlers: KazeRouteHandler[]): void {
        const isDynamicRoute = route.includes("/:");
        
        AcceptedMethods.forEach(method => {
            if(!isDynamicRoute) {
                this.#routeMap.get(method)?.set(route, handlers);
                return;
            }
    
            const dynRouteSeg = this.#genRouteSegment(route);
            const dynRouteInfo: DynamicRouteInfo = {
                dynSeg: dynRouteSeg.dynamicRouteSeg,
                normSeg: dynRouteSeg.normalSeg,
                fullRoute: route,
                handlers
            }
            this.#dynamicRouteMap.get(method)?.set(dynRouteSeg.routeSegments.length, dynRouteInfo);
        })
    }

    fetchRoutes(): Map<KazeHttpMethod, RouteMap> {
        return this.#routeMap;
    }

    fetchDynamicRoutes(): Map<KazeHttpMethod, DynamicRouteMap> {
        return this.#dynamicRouteMap;
    }

    fetchHandlers(
        route: string,
        reqMethod: KazeHttpMethod
    ): KazeRouteHandler[] | DynamicRoute | undefined {
        let handlers = this.#routeMap.get(reqMethod)?.get(route);
        if(!handlers) {
            const routeSegments = route.split("/");

            const dynSegInfo = this.#dynamicRouteMap.get(reqMethod)?.get(routeSegments.length);

            if(!dynSegInfo) {
                return;
            }
            
            const dynSegStartIdx = routeSegments.length - dynSegInfo.dynSeg.length;

            const paramsMap: Record<string, string> = {};
            
            for(let i = 0; i < dynSegInfo.dynSeg.length; ++i) {
                paramsMap[dynSegInfo.dynSeg[i]] = routeSegments[i + dynSegStartIdx];
            }

            return {
                params: paramsMap,
                handlers: dynSegInfo.handlers
            }
        }
        return handlers;
    }
};