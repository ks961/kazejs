export class KazeValidationError extends Error {
    vErrors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>) {
        super();
        this.vErrors = errors;
        this.name = "KazeValidationError";
        this.message = "validation error occured.";
    }
}

export class KazeRouteError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super();
        this.statusCode = statusCode;
        this.name = "KazeRouteError";
        this.message = message;
    }
    
}

export class KazeRouteNotFound extends KazeRouteError {
    constructor(message: string) {
        super(404, message);
        this.name = "KazeRouteNotFound";
    }    
}