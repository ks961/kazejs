import { KazeRouteHandler } from "./kaze";

export type TConstructor = new() => {};

function createHttpMethodDecorator(method: string, route: string) {

    return function (
        _targetFn: KazeRouteHandler | TConstructor,
        _propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
        if (descriptor?.value) {
            descriptor.value["httpMethod"] = method;
            descriptor.value["route"] = route;
            return;
        }

        throw new Error(`'${method.charAt(0).toUpperCase() + method.slice(1)}' decorator cannot be used here.`);
    }
}

export const Get = (route: string) => createHttpMethodDecorator('get', route);
export const Post = (route: string) => createHttpMethodDecorator('post', route);
export const Put = (route: string) => createHttpMethodDecorator('put', route);
export const Delete = (route: string) => createHttpMethodDecorator('delete', route);
export const Patch = (route: string) => createHttpMethodDecorator('patch', route);
export const Head = (route: string) => createHttpMethodDecorator('head', route);
export const Options = (route: string) => createHttpMethodDecorator('options', route);
export const Trace = (route: string) => createHttpMethodDecorator('trace', route);
export const Connect = (route: string) => createHttpMethodDecorator('connect', route);
export const Link = (route: string) => createHttpMethodDecorator('link', route);
export const Unlink = (route: string) => createHttpMethodDecorator('unlink', route);
export const All = (route: string) => createHttpMethodDecorator('all', route);

export function ParentRoute(
    route: string
) {
    
    return function(
        targetFn: TConstructor,
        _propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
            if(descriptor?.value) {
                throw new Error("'Get' decorator cannot use be used here.");
            }

            (targetFn as any)["parentRoute"] = route;
    }
}

/*
else {
            // (targetFn as any)["httpMethod"] = "get";
            (targetFn as any)["routeGrp"] = route;
        }
*/