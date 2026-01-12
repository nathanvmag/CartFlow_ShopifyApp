import { ActionFunctionArgs } from "react-router";
import { createFulfillmentService } from "../services/fulfillments/create-fulfillment.service";
import { ensureHttpMethod } from "../utils/http.server";


export async function action({ request }: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "POST");
  if (methodError) return methodError;

  return createFulfillmentService(request);
}
