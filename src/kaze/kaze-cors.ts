import { IncomingMessage } from "http";
import { KazeContext, KazeNextFunction, KazeHttpMethod, KazeRouteHandler } from "./kaze";

export type KazeCapitalizedHeaders = 
    Capitalize<Extract<keyof IncomingMessage["headers"], string>>;

export type OriginFn = (origin: string) => string;

export interface KazeCorsOptions {
    maxAge: number,
    credentials: boolean,
    origin: string | OriginFn,
    allowHeaders: Array<KazeCapitalizedHeaders>,
    exposeHeaders: Array<KazeCapitalizedHeaders>,
    allowMethods: Array<Uppercase<KazeHttpMethod>>,
}

const optionHeaderMap: Record<keyof KazeCorsOptions, string> = {
    maxAge: "Access-Control-Max-Age",
    origin: "Access-Control-Allow-Origin",
    allowHeaders: "Access-Control-Allow-Headers",
    allowMethods: "Access-Control-Allow-Methods",
    credentials: "Access-Control-Allow-Credentials",
    exposeHeaders: "Access-Control-Expose-Headers",
}

export function cors(options: KazeCorsOptions): KazeRouteHandler {

    return function(ctx: KazeContext, next: KazeNextFunction) {

        Object.keys(options).map((key) => {
            const option = options[key as keyof KazeCorsOptions];

            const header = optionHeaderMap[key as keyof KazeCorsOptions];

            if(Array.isArray(option)) {
                ctx.res.setHeader(header, option.join(", "));
                return;
            }
            
            if(key === "origin" && option instanceof Function) {
                const protocol = ctx.req.secure ? "https" : "http"
                const reqOrigin = `${protocol}://${ctx.req.headers["host"]}`

                const result = option(reqOrigin);
                ctx.res.setHeader(header, result);
            } else {
                ctx.res.setHeader(header, option.toString());
            }
        });

        next();
    }
}