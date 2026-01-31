import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { ensureHttpMethod } from "app/utils/http.server";
import { getAllProductsService } from "app/services/products/get-products-service";
import { saveProductWebhookSelectionService } from "app/services/products/save-product-webhook-selection.service";

export async function action({request}: ActionFunctionArgs) {
  const methodError = ensureHttpMethod(request, "POST");
  if (methodError) return methodError;

  return saveProductWebhookSelectionService(request);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const methodError = ensureHttpMethod(request, "GET");
  if (methodError) return methodError;

  return getAllProductsService(request);
}
