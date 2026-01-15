import { LoaderFunctionArgs } from "react-router";
import { ensureHttpMethod } from "../utils/http.server";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { getOrderFulfillmentsService } from "app/services/fulfillments/get-order-fulfillments.service";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const methodError = ensureHttpMethod(request, "GET");
  if (methodError) return methodError;

  const { orderId } = params;

  if (!orderId) {
    return httpResponse({
      status: HttpStatus.BAD_REQUEST,
      message: "orderId parameter is required",
    });
  }

  return getOrderFulfillmentsService(request, orderId);
}
