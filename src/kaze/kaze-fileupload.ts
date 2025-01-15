import { getMimeType } from "@d3vtool/utils";
import { KazeContext, KazeNextFunction } from "./kaze";

export type FileSizeBytes = number;

export type FilenameMutateFn = (filename: string) => string;

export type KazeFile = {
    fieldName: string,
    fileName: string,
    fileSize: number,
    fileBuffer: string,
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
    
    const contents = body.split(boundary);
    contents.shift(); // discard "--"
    contents.pop(); // discard "--\r\n"
    
    for(let i = 0; i < contents.length; ++i) {
        const contentInfo = contents[i].split("; ");
        contentInfo.shift();
    
        if(contents[i].includes("filename")) {
            const [fieldInfo, fileInfo] = contentInfo;
            
            const [ fileMetaData, fileContent ] = fileInfo.split("\r\n\r\n");            
            const [ fileNameField, fileMimeType ] = fileMetaData.split("\r\n");
            
            if(
                options?.limit && (fileContent.length > options?.limit) ||
                (options?.acceptedMimeType && !(options.acceptedMimeType.includes(fileMimeType as any)))
            ) {                
                continue;
            }
            
            const fieldValue = fieldInfo.split("=").pop()!;

            const file: KazeFile = {
                fieldName: options?.fileNameMutateFn ? 
                    options?.fileNameMutateFn(fieldValue.replaceAll('\"', '')) : 
                    fieldValue.replaceAll('\"', ''),
                    
                fileName: fileNameField.split("=").pop()!.replaceAll('\"', '')!,
                fileSize: fileContent.length,
                fileBuffer: fileContent.replace(/\r\n--$/, ""),
                mimeType: fileMimeType.split(": ").pop()! as any,
            }
            
            parsedData.files.push(file);
        } else {
            let [ fieldInfo, fieldData ] = contentInfo[0].split("\r\n\r\n").map(x => x.replace("\r\n--", ""));
            
            const fieldName = fieldInfo.split("=").pop()?.replaceAll('\"', "")!;
            
            parsedData.fieldInfo[fieldName] = fieldData;
        }
    }
    
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
                ctx.req.rawBody,
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