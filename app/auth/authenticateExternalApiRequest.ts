import { sessionStorage } from "../shopify.server";
import prisma from "../db.server";
import type { Session } from "@shopify/shopify-api";
import { badRequest, unauthorized } from "app/utils/http-responses.server";
import { hashExternalToken } from "app/utils/security.server";

export type ExternalAuthResult = {
  shop: string;
  session: Session;
};

export async function authenticateExternalApiRequest(
  request: Request,
): Promise<ExternalAuthResult> {
  const shopHeader = request.headers.get("X-Shop");
  const storeToken = request.headers.get("X-Store-Token");

  if (!shopHeader) {
    throw badRequest("X-Shop header is required");
  }

  if (!storeToken) {
    throw badRequest("X-Store-Token header is required");
  }

  const hashedToken = hashExternalToken(storeToken);

  const shopRecord = await prisma.shop.findUnique({
    where: { externalTokenHash: hashedToken },
  });

  if (!shopRecord) {
    throw unauthorized();
  }

  const shop = shopRecord.shopDomain;

  if (shopHeader && shopHeader.toLowerCase() !== shop.toLowerCase()) {
    throw unauthorized();
  }

  const sessionId = `offline_${shopRecord.shopDomain}`;
  const session = (await sessionStorage.loadSession(
    sessionId,
  )) as Session | null;

  if (!session) {
    throw unauthorized("Shopify session not found");
  }

  return {
    shop,
    session,
  };
}
