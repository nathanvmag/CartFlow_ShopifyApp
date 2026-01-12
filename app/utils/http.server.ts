export function ensureHttpMethod(
  request: Request,
  allowedMethods: string[] | string,
): Response | null {
  const methods = Array.isArray(allowedMethods)
    ? allowedMethods
    : [allowedMethods];
  const method = request.method.toUpperCase();

  if (!methods.map((m) => m.toUpperCase()).includes(method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }

  return null;
}
