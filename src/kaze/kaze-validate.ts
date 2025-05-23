import { ObjectValidator } from "@d3vtool/utils";
import { KazeValidationError } from "./kaze-errors";
import { KazeContext, KazeNextFunction } from "./kaze";
import { TAllDataValidators } from "@d3vtool/utils/dist/types/validator/types";

export function queryValidate<T extends ObjectValidator<Record<string, TAllDataValidators>>>(
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
        
        next();
    }
}

export function paramsValidate<T extends ObjectValidator<Record<string, TAllDataValidators>>>(
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

        next();
    }
}