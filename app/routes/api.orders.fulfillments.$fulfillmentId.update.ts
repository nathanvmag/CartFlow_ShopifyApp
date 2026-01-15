import { ensureHttpMethod } from "../utils/http.server";
import { updateFulfillmentService } from "../services/fulfillments/update-fulfillment.service";
import { ActionFunctionArgs } from "react-router";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "PUT");
  if (methodError) return methodError;

  const { fulfillmentId } = params;

  if (!fulfillmentId) {
    return httpResponse({
      status: HttpStatus.BAD_REQUEST,
      message: "fulfillmentId parameter is required",
    });
  }

  return updateFulfillmentService(request, fulfillmentId);
}
