import { ActionFunctionArgs } from "react-router";
import { createFulfillmentService } from "../services/fulfillments/create-fulfillment.service";
import { ensureHttpMethod } from "../utils/http.server";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "POST");
  if (methodError) return methodError;

  const { orderId } = params;

  if (!orderId) {
    return httpResponse({
      status: HttpStatus.BAD_REQUEST,
      message: "orderId parameter is required",
    });
  }

  return createFulfillmentService(request, orderId);
}
