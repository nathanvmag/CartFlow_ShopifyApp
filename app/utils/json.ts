import { httpResponse, HttpStatus } from "./http-responses.server";

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw httpResponse({
      status: HttpStatus.BAD_REQUEST,
      message: "Invalid JSON body",
    });
  }
}
