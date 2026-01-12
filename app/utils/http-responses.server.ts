export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export function badRequest(message: string) {
  return httpResponse({
    status: HttpStatus.BAD_REQUEST,
    message,
  });
}

export function unauthorized(message: string = "Unauthorized") {
  return httpResponse({
    status: HttpStatus.UNAUTHORIZED,
    message,
  });
}

export function notFound(message: string) {
  return httpResponse({
    status: HttpStatus.NOT_FOUND,
    message,
  });
}

type HttpResponseOptions<T> = {
  status: HttpStatus;
  data?: T;
  message?: string;
  headers?: HeadersInit;
};

export function httpResponse<T>({
  status,
  data,
  message,
  headers,
}: HttpResponseOptions<T>) {
  if (status === HttpStatus.NO_CONTENT) {
    return new Response(null, { status });
  }

  const body = data !== undefined ? JSON.stringify(data) : (message ?? null);

  return new Response(body, {
    status,
    headers: {
      ...(data !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
  });
}
