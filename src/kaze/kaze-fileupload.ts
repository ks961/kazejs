import { getMimeType } from "@d3vtool/utils";
import { KazeContext, KazeNextFunction } from "./kaze";
import { writeFileSync } from "fs";

export type FileSizeBytes = number;

export type FilenameMutateFn = (filename: string) => string;

export type KazeFile = {
    fieldName: string,
    fileName: string,
    fileSize: number,
    fileBuffer: Buffer,
    mimeType: ReturnType<typeof getMimeType>,
}

export type FileUploadOptions = {
    limit?: FileSizeBytes,
    fileNameMutateFn?: FilenameMutateFn, 
    acceptedMimeType?: ReturnType<typeof getMimeType>[],
}

export type ParsedData = {
    files: KazeFile[],
    fieldInfo: Record<string, string>,
}

function parseMultiPartData(
    body: string,
    boundary: string,
    options?: FileUploadOptions
): ParsedData {
    const parsedData: ParsedData = {
        fieldInfo: {},
        files: []
    };
    
    return parsedData;
}

export function fileUpload(options?: FileUploadOptions) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        const contentType = ctx.req.headers["content-type"];
        
        if(
            !contentType ||
            !contentType?.includes("multipart/form-data")
        ) {
            next();
            return;
        }
        
        try {
            const boundary = contentType!.split("; ")[1].split("=").pop()!;
            const parsedData = parseMultiPartData(
                ctx.req.rawBody.toString("utf8"),
                boundary,
                options
            );

            ctx.req.body = parsedData.fieldInfo;
            ctx.req.files = parsedData.files;
            
        } catch {
        } finally {            
            next();
        }
    }
}