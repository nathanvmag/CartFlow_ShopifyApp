import { LoaderFunctionArgs } from "react-router";
import { getAllOrdersService } from "../services/orders/get-all-orders.service";
import { ensureHttpMethod } from "../utils/http.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const methodError = ensureHttpMethod(request, "GET");
  if (methodError) return methodError;

  return getAllOrdersService(request);
}
