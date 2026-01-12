import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import type { Session } from "@shopify/shopify-api";

export const adminApi = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") || [],
  // hostName deve ser só o domínio, sem protocolo
  // Exemplo: se SHOPIFY_APP_URL = "https://meuapp.ngrok.app",
  // hostName fica "meuapp.ngrok.app"
  hostName: process.env
    .SHOPIFY_APP_URL!.replace(/^https?:\/\//, "")
    .replace(/\/$/, ""),
  apiVersion: ApiVersion.October25,
  isEmbeddedApp: true,
});

export function restClientFromSession(session: Session) {
  return new adminApi.clients.Rest({ session });
}

export function graphqlClientFromSession(session: Session) {
  return new adminApi.clients.Graphql({ session });
}
