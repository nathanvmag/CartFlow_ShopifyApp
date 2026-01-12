import { ensureHttpMethod } from "../utils/http.server";
import { rotateTokenService } from "../services/settings/rotate-token.service";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "POST");
  if (methodError) return methodError;

  return rotateTokenService(request);
}
