import { ObjectValidator } from "@d3vtool/utils";
import { KazeValidationError } from "./kaze-errors";
import { KazeContext, KazeNextFunction } from "./kaze";
import {
    Validator, 
    VInfer, 
    ValidationError, 
    ObjectValidationError,

} from "@d3vtool/utils";

export function queryValidate<T extends ObjectValidator<Record<string, any>>>(
    schema: T,
    noQueryErrorMsg: string = "No queries found to validate"
) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        if(!(schema instanceof Object)) {
            throw new KazeValidationError({
                error: ["Invalid schema"]
            });
        }

        if(!ctx.req.query) {
            throw new Error(noQueryErrorMsg);
        }

        const errors = schema.validateSafely(ctx.req.query);
        
        if(Object.keys(errors).length > 0) {
            // send all errors to global error handler
            // let user decide what to do with them.
            throw new KazeValidationError(errors);
        }


        try {
            ctx.req.query = JSON.parse(ctx.req.query as any);
        } catch (err) {
            const msg = `Invalid Query: ${(err instanceof Error) ? err.message : "Query structure is invalid."}`;
            throw new KazeValidationError({
                error: [msg]
            });
        }
        
        next();
    }
}

export function paramsValidate<T extends ObjectValidator<Record<string, any>>>(
    schema: T,
    noParamsErrorMsg: string = "No params found to validate"
) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        if(!(schema instanceof Object)) {
            throw new KazeValidationError({
                error: ["Invalid schema"]
            });
        }

        if(!ctx.req.params) {
            throw new Error(noParamsErrorMsg);
        }

        const errors = schema.validateSafely(ctx.req.params);
        
        if(Object.keys(errors).length > 0) {
            // send all errors to global error handler
            // let user decide what to do with them.
            throw new KazeValidationError(errors);
        }
       
        try {
            ctx.req.params = JSON.parse(ctx.req.params as any);
        } catch (err) {
            const msg = `Invalid Params: ${(err instanceof Error) ? err.message : "Params body is invalid."}`;
            throw new KazeValidationError({
                error: [msg]
            });
        }

        next();
    }
}

export {
    Validator,
    type VInfer,
    ValidationError,
    ObjectValidationError,
}