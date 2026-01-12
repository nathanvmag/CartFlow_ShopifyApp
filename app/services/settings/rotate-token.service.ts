import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { notFound } from "../../utils/http-responses.server";
import {
  generateExternalToken,
  hashExternalToken,
} from "../../utils/security.server";

export async function rotateTokenService(request: Request) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shopRecord) {
    throw notFound("Shop not found");
  }

  const newToken = generateExternalToken();
  const tokenHash = hashExternalToken(newToken);

  await prisma.shop.update({
    where: { shopDomain },
    data: {
      externalTokenHash: tokenHash,
      tokenViewedAt: new Date(),
    },
  });

  return Response.json({
    token: newToken,
  });
}
