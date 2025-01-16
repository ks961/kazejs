import { getMimeType } from "@d3vtool/utils";
import { KazeContext, KazeNextFunction } from "./kaze";

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

export function fileUpload(options?: FileUploadOptions) {

    return function(ctx: KazeContext, next: KazeNextFunction) {
        const contentType = ctx.req.headers["content-type"];
        
        if(
            !contentType ||
            !contentType?.includes("multipart/form-data")
        ) {
            return next();
        }
        
        let chunks: Buffer[] = [];
        ctx.req.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });
        

        ctx.req.on("end", () => {
            const body = Buffer.concat(chunks);

            const boundary = ctx.req.headers['content-type']!.split('boundary=')[1];
            const boundaryString = `--${boundary}`;
      
            const bodyStr = body.toString('binary');
      
            const parts = bodyStr.split(boundaryString);

            const [withFilename, withoutFilename] = parts.reduce<[string[], string[]]>(
                ([withFilename, withoutFilename], part) => {
                  if (part.includes('filename')) {
                    withFilename.push(part);
                  } else {
                    withoutFilename.push(part);
                  }
                  return [withFilename, withoutFilename];
                }, [[], []]);
            
            if (withFilename.length > 0) {
                ctx.req.files = [];
                for(let idx = 0; idx < withFilename.length; ++idx) {
                    const [ fileInfoStr, _] = withFilename[idx].split("\r\n\r\n");
                    const fileInfo = fileInfoStr.split("\r\n");
                    fileInfo.shift(); // discard '' empty str;
                    const [ contentDispositionStr, contentType ] = fileInfo;
                    
                    const fieldName = contentDispositionStr.match(/name="([^"]+)"/)![1];
                    const fileName = contentDispositionStr.match(/filename="([^"]+)"/)![1];

                    const mimeType = contentType.split(": ").pop()! as any;
                    
                    const fileDataStart = withFilename[idx].indexOf('\r\n\r\n') + 4;
                    const fileDataEnd = withFilename[idx].lastIndexOf('\r\n');
                                        
                    const startIndex = bodyStr.indexOf(withFilename[idx]) + fileDataStart;
                    const endIndex = bodyStr.indexOf(withFilename[idx]) + fileDataEnd;
                    
                    const fileSize = endIndex - startIndex;

                    if(
                        options?.limit && fileSize > options.limit ||
                        options?.acceptedMimeType && !options.acceptedMimeType.includes(mimeType)
                    ) {
                        continue;
                    }
                    
                    const fileBuffer = body.subarray(startIndex, endIndex);
                    
                    const file: KazeFile = {
                        fieldName,
                        fileName: options?.fileNameMutateFn ? 
                            options.fileNameMutateFn(fileName) : fileName,
                        fileSize,
                        fileBuffer,
                        mimeType, 
                    }

                    ctx.req.files?.push(file);
                }
            }

            if(withoutFilename.length > 0) {
                ctx.req.body = {};
                withoutFilename.shift();
                withoutFilename.pop();
                for(let idx = 0; idx < withoutFilename.length; ++idx) {
                    let [ fieldInfoStr, fieldData] = withoutFilename[idx].split("\r\n\r\n");
                    
                    const fieldName = fieldInfoStr.match(/name="([^"]+)"/)![1];
                    fieldData = fieldData.replaceAll("\r\n", "");
                    ctx.req.body[fieldName] = fieldData;
                }
            }

            next();
        });
    }
}