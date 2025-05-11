import { ObjectValidator } from "@d3vtool/utils";
import { KazeContext, KazeNextFunction } from "./kaze";
import { KazeValidationError } from "./kaze-errors";
import { TAllDataValidators } from "@d3vtool/utils/dist/types/validator/types";

function parseUrlEncoded(body: string): Record<string, string> {
    const bodyData = body.split("&");

    const parsedData = bodyData.reduce((acc, data) => {
        const [ key, value ] = data.split("=");
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
        return acc;
    }, {} as Record<string, string>);

    return parsedData;
}

export function parseBody() {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        const contentType = ctx.req.headers["content-type"]?.toLowerCase();

        if (!contentType || !['POST', 'PUT', 'PATCH'].includes(ctx.req.method ?? "")) {
            return next();
        }
        
        const chunks: Buffer[] = [];
        ctx.req.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });
        
        ctx.req.on("end", () => {
            try {
                const data = Buffer.concat(chunks).toString();
                
                if (contentType.includes("application/x-www-form-urlencoded")) {
                    ctx.req.body = parseUrlEncoded(data);
                } else if (contentType.includes("application/json")) {
                    ctx.req.body = JSON.parse(data);
                } else {
                    ctx.req.body = null;
                }
            } catch (err) {
                ctx.req.body = null;
            } finally {
                next();
            }
        });
    }
}

export function jsonValidate<T extends ObjectValidator<Record<string, TAllDataValidators>>>(
    schema: T,
    noJsonErrorMsg: string = "No json found to validate"
) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        if(!(schema instanceof Object)) {
            throw new KazeValidationError({
                error: ["Invalid schema"]
            });
        }
        
        if(!ctx.req.body) {
            throw new Error(noJsonErrorMsg);
        }

        const errors = schema.validateSafely(ctx.req.body);

        if(Object.keys(errors).length > 0) {
            // send all errors to global error handler
            // let user decide what to do with them.
            throw new KazeValidationError(errors);
        }


        try {
            ctx.req.body = JSON.parse(ctx.req.body);
        } catch (err) {
            const msg = `Invalid JSON: ${(err instanceof Error) ? err.message : "JSON body is invalid."}`;
            throw new KazeValidationError({
                error: [msg]
            });
        }

        next();
    }
}