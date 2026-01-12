import { httpResponse, HttpStatus } from "./http-responses.server";

export function handleServiceError(err: unknown) {
  if (err instanceof Response) {
    return err;
  }

  if (err instanceof Error) {
    return httpResponse({
      status: HttpStatus.BAD_REQUEST,
      message: err.message,
    });
  }

  return httpResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Unexpected error",
  });
}
