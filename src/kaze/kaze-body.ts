import { ObjectValidator } from "@d3vtool/utils/dist/validator/ObjectValidator";
import { KazeContext, KazeNextFunction } from "./kaze";
import { KazeValidationError } from "./kaze-errors";
import { parseBySchemaType } from "./kaze-validate";

type JsonOption = {
    urlencoded: boolean
}

function parseUrlEncoded(body: string): Record<string, string> {
    const bodyData = body.split("&");

    const parsedData = bodyData.reduce((acc, data) => {
        const [ key, value ] = data.split("=");
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
        return acc;
    }, {} as Record<string, string>);

    return parsedData;
}

export function parseJson(option: JsonOption = {
    urlencoded: false
}) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        const contentType = ctx.req.headers["content-type"];
        try {
            if(
                contentType === "application/x-www-form-urlencoded" &&
                option.urlencoded
            ) {
                ctx.req.body = parseUrlEncoded(ctx.req.rawBody);
            } else if(contentType === "application/json" && !option.urlencoded) {
                ctx.req.body = JSON.parse(ctx.req.rawBody);
            } else {
                ctx.req.body = null;
            }
        } catch {
            ctx.req.body = null;
        } finally {
            next();
        }
    }
}

export function jsonValidate<T extends ObjectValidator<any>>(
    schema: T,
    noJsonErrorMsg: string = "No json found to validate"
) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        if(!(schema instanceof Object)) {
            throw new KazeValidationError({
                error: ["Invalid schema"]
            });
        }
        
        if(!ctx.req.rawBody) {
            throw new Error(noJsonErrorMsg);
        }

        const errors = schema.validateSafely(ctx.req.body);

        if(Object.keys(errors).length > 0) {
            // send all errors to global error handler
            // let user decide what to do with them.
            throw new KazeValidationError(errors);
        }

        const schemaTypes = schema.extractTypes();
       
        ctx.req.body = parseBySchemaType(ctx.req.body, schemaTypes);

        next();
    }
}