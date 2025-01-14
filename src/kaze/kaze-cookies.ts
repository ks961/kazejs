import { StringUtils } from "@d3vtool/utils";
import { KazeContext, KazeNextFunction } from "./kaze";

export interface CookieOptions {
    path?: string;
    domain?: string;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
    expires?: Date | string; 
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export function createCookie(
    key: string,
    value: string,
    options: CookieOptions
) {
    let cookie = [`${key}=${value}`];

    Object.keys(options).forEach(optionKey => {
        const optionValue = options[optionKey as keyof CookieOptions];

        if(optionKey === "sameSite" || optionKey === "httpOnly") {
            cookie.push(`${StringUtils.toTitleCase(optionKey)}=${optionValue}`);
        } else if(optionKey === "maxAge") {
            cookie.push(`Max-Age=${optionValue}`);
        }

        if(typeof optionValue === "string") {
            cookie.push(`${optionKey}=${optionValue}`);
        } else if(optionValue instanceof Date) {
            cookie.push(`${optionKey}=${optionValue.toUTCString()}`);
        } else if(typeof optionValue === "boolean") {
            cookie.push(optionKey);
        }
    });

    return cookie.join("; ");
}

export class Cookie {
    #cookiesMap: Record<string, string>;
    constructor(cookies: Record<string, string>) {
        this.#cookiesMap = cookies;
    }

    get(key: string): Readonly<string> {
        return this.#cookiesMap[key];
    }
}

export function parseCookies(ctx: KazeContext, next: KazeNextFunction) {
    
    const cookiesStr = ctx.req.headers["cookie"];

    if(!cookiesStr) {
        const cookies = new Cookie({})
        ctx.req.cookies = cookies;
        next();
        return;
    }
    
    const cPairs = cookiesStr.split("; ");
    const cookies = cPairs.reduce((acc, cookie) => {
        
        const [ key, value ] = cookie.split("=");
        acc[key] = value;
        
        return acc;
    }, {} as Record<string, string>);

    ctx.req.cookies = new Cookie(cookies);
    next();
}