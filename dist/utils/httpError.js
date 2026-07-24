export class HttpError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, code = 'REQUEST_FAILED') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
export function notFound(message = 'Resource not found') {
    return new HttpError(404, message, 'NOT_FOUND');
}
