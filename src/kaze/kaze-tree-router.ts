import { KazeRouteHandler, KazeHttpMethod } from "./kaze";
import { DynamicRoute, Router } from "./kaze-router";


class TreeRouterNode {
    path: string;
    handler?: KazeRouteHandler;
    children: TreeRouterNode[];
    params: Record<string, string | null> = {};

    constructor(path: string, handler?: KazeRouteHandler) {
        this.path = path;
        this.children = [];
        this.handler = handler;
        if(path.startsWith(":")) {
            const param = path.substring(1,);
            this.params[param] = null;
        }
    }

    attachHandler(handler: KazeRouteHandler) {
        this.handler = handler;
    }
}


export class TreeRouter extends Router {
    #getRootNode: TreeRouterNode;
    constructor() {
        super();
        this.#getRootNode = new TreeRouterNode("/");
    }

    getAuxInsertNewPath(
        root: TreeRouterNode, 
        routeSeg: string[], 
        currentIdx: number, 
        handler: KazeRouteHandler
    ) {

    }

    getAux(root: TreeRouterNode, routeSeg: string[], currentIdx: number, handler: KazeRouteHandler) {
        if(root.path === routeSeg[currentIdx] && root.children.length > 0) {
            currentIdx++;
            for(const child of root.children) { // continue.
                if(child.path === routeSeg[currentIdx] && currentIdx < routeSeg.length - 1) {
                    this.getAux(child, routeSeg, currentIdx, handler);
                } else if(child.path === routeSeg[currentIdx] && currentIdx === routeSeg.length - 1) {
                    child.attachHandler(handler);
                }
            }            
        } else if(root.path === routeSeg[currentIdx] && root.children.length === 0) {

        }
    }

    get(route: string, ...handlers: KazeRouteHandler[]): void {
        const routeSeg = route.split("/").unshift("/");

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
    middlewares(...handlers: KazeRouteHandler[]): void {
        throw new Error("Method not implemented.");
    }
    fetchMiddlewares(): KazeRouteHandler[] {
        throw new Error("Method not implemented.");
    }
    fetchHandlers(route: string, reqMethod: KazeHttpMethod): KazeRouteHandler[] | DynamicRoute | undefined {
        throw new Error("Method not implemented.");
    }

}