import { KazeRouteHandler, KazeHttpMethod } from "./kaze";
import { DynamicRoute, Router } from "./kaze-router";

export class TreeRouterNode {
    #path: string;
    #query: string | null;
    #params: string | null;
    children: TreeRouterNode[];
    #handlers: KazeRouteHandler[];

    constructor(
        path: string, 
        query: string | null = null,
        ...handlers: KazeRouteHandler[]
    ) {
        this.#path = path;
        this.#query = query;
        this.#params = null;
        this.children = [];
        this.#handlers = handlers ?? [];
    }

    handlers() {
        return this.#handlers;
    }

    path() {
        return this.#path;
    }

    query() {
        return this.#query;
    }

    params() {
        return this.#params;
    }

    setParams(params: string) {
        this.#params = params;
    }

    hasHandlers() {
        return this.#handlers.length > 0;
    }

    setHandlers(...handlers: KazeRouteHandler[]) {
        this.#handlers = handlers;
    }

    isDynamic() {
        return this.#path.startsWith("/:");
    }
}

export class TreeRouter extends Router {

    #getRoot: TreeRouterNode;

    constructor() {
        super();        
        this.#getRoot = new TreeRouterNode("/");
    }

    #getAuxAdd(
        node: TreeRouterNode,
        routeSeg: string[],
        routeSegIdx: number,
        ...handlers: KazeRouteHandler[]    
    ) {
        if(routeSegIdx === routeSeg.length - 1) {
            node.children.push(new TreeRouterNode(
                routeSeg[routeSegIdx],
                null,
                ...handlers
            ));
        } else {
            node.children.push(new TreeRouterNode(routeSeg[routeSegIdx++]));
            this.#getAuxAdd(node.children[node.children.length - 1], routeSeg, routeSegIdx, ...handlers);
        }        
    }

    #getInsertAux(
        node: TreeRouterNode, 
        routeSeg: string[], 
        routeSegIdx: number,
        ...handlers: KazeRouteHandler[]
    ): void {
        
        if(node.children.length === 0) {
            this.#getAuxAdd(
                node,
                routeSeg,
                routeSegIdx,
                ...handlers
            )
        } else {
            let isFound = false;
            routeSegIdx++;
            for(let i = 0; i < node.children.length; ++i) {
                if(node.children[i].path() === routeSeg[routeSegIdx]) {
                    isFound = true;
                    this.#getInsertAux(node.children[i], routeSeg, routeSegIdx, ...handlers);
                }
            }
            if(!isFound) {
                this.#getAuxAdd(
                    node,
                    routeSeg,
                    routeSegIdx,
                    ...handlers
                )
            }
        }

    }

    get(route: string, ...handlers: KazeRouteHandler[]): void {
        if(route === "/") {
            this.#getRoot.setHandlers(...handlers);
        } else {
            const routeSeg = route.split("/");
            routeSeg.shift();
            this.#getInsertAux(this.#getRoot, routeSeg, 0, ...handlers);
        }        
    }
    post(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    put(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    delete(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    patch(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    head(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    options(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    trace(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    connect(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    link(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    unlink(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    all(route: string, ...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }

    #fetchHandlerAux(
        node: TreeRouterNode,
        routeSeg: string[],
        routeSegIdx: number
    ): KazeRouteHandler[] | undefined {
        if(
            node.path() === routeSeg[routeSegIdx] &&
            routeSegIdx === routeSeg.length - 1
        ) {
            return node.handlers();
        } else if(
            node.path() === routeSeg[routeSegIdx] &&
            routeSegIdx < routeSeg.length - 1
        ) {
            routeSegIdx++;
            for(let i = 0; i < node.children.length; ++i) {
                if(
                    node.children[i].path() === routeSeg[routeSegIdx]
                ) {
                    return this.#fetchHandlerAux(node.children[i], routeSeg, routeSegIdx);       
                }
            }
        }
    }

    fetchHandlers(route: string, reqMethod: KazeHttpMethod): KazeRouteHandler[] | DynamicRoute | undefined {

        if(route === "*") return;
        const routeSeg = route.split("/");
        routeSeg[0] = "/";
        const handlers = this.#fetchHandlerAux(this.#getRoot, routeSeg, 0);        
        
        return handlers;
    }

}