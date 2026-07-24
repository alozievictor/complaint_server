export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'REQUEST_FAILED',
  ) {
    super(message);
  }
}

export function notFound(message = 'Resource not found') {
  return new HttpError(404, message, 'NOT_FOUND');
}
