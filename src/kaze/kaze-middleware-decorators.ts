import { TConstructor } from "./kaze-route-decorators";
import { ErrorHandlerFn, KazeRouteHandler, ValidationFailedFn } from "./kaze";


export function Middlewares(
    ...handlers: KazeRouteHandler[]
) {

    return function(
        targetFn: KazeRouteHandler | TConstructor,
        _propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
        if(descriptor?.value) {
            descriptor.value["handlers"] = handlers;
        } else {
            (targetFn as any)["handlers"] = handlers;
        }
    }
}


export function ErrorHandler(
    handlers: ErrorHandlerFn
) {

    return function(
        targetFn: KazeRouteHandler | TConstructor,
        _propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
        if(descriptor?.value) {
            descriptor.value["errorHandler"] = handlers;
        } else {
            (targetFn as any)["errorHandler"] = handlers;
        }
    }
}

export function VErrorHandler(
    handlers: ValidationFailedFn
) {

    return function(
        targetFn: KazeRouteHandler | TConstructor,
        _propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
        if(descriptor?.value) {
            descriptor.value["vErrorHandler"] = handlers;
        } else {
            (targetFn as any)["vErrorHandler"] = handlers;
        }
    }
}