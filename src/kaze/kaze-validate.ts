import { KazeContext, KazeNextFunction } from "./kaze";
import { KazeValidationError } from "./kaze-errors";
import { AcceptedObjVTypes, ObjectValidator } from "@d3vtool/utils/dist/validator/ObjectValidator";
import {
    Validator, 
    VInfer, 
    ValidationError, 
    ObjectValidationError,

} from "@d3vtool/utils"; 

export function parseBySchemaType(
    data: Record<string, string>, 
    schemaTypes: Record<string, Object | AcceptedObjVTypes>
) {
    
    const parsedData = Object.keys(data).reduce((acc, key) => {
        if(schemaTypes[key] === "number") {
            acc[key] = parseInt(data[key])
        } else if(schemaTypes[key] instanceof Object) {
            const deepParsedData = parseBySchemaType((data as any)[key], schemaTypes[key] as any);
            acc[key] = deepParsedData;
        } else {
            acc[key] = data[key];
        }
        return acc;
    }, {} as Record<string, unknown>);

    return parsedData;
}

export function queryValidate<T extends ObjectValidator<any>>(
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

        const schemaTypes = schema.extractTypes()
       
        ctx.req.query = parseBySchemaType(ctx.req.query, schemaTypes);        
        
        next();
    }
}

export function paramsValidate<T extends ObjectValidator<any>>(
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

export {
    Validator,
    type VInfer,
    ValidationError,
    ObjectValidationError,
}