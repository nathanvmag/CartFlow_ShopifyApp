import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shopRecord) {
    throw new Response("Shop not found", { status: 404 });
  }

  return Response.json({
    shop: shopDomain,
  });
}