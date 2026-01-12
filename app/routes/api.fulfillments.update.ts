import { ensureHttpMethod } from "../utils/http.server";
import { updateFulfillmentService } from "../services/fulfillments/update-fulfillment.service";
import { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "POST");
  if (methodError) return methodError;

  return updateFulfillmentService(request);
}
