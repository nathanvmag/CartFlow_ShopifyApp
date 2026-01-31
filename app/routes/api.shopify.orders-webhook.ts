// app/routes/api.shopify.orders-webhook.ts
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload, apiVersion } =
    await authenticate.webhook(request);

  console.log(
    `Received ${topic} webhook for ${shop} (API version ${apiVersion})`,
  );

  if (
    ![
      "ORDERS_CREATE",
      "ORDERS_PAID",
      "ORDERS_UPDATED",
      "ORDERS_CANCELLED",
      "ORDERS_FULFILLED",
    ].includes(topic)
  ) {
    return new Response(null, { status: 200 });
  }

  const CARTFLOW_API_URL = process.env.CARTFLOW_API_URL;

  if (!CARTFLOW_API_URL) {
    console.error("CARTFLOW_API_URL is not defined in environment variables");
    return new Response(null, { status: 200 });
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = payload as any;

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = order.line_items ?? [];

  const productGraphqlIds: string[] = [];
  for (const item of lineItems) {
    if (item.product_id) {
      productGraphqlIds.push(`gid://shopify/Product/${item.product_id}`);
    }
  }

  if (productGraphqlIds.length === 0) {
    console.log(
      `Order ${order.id || order.name || ""} has no product ids; skipping forwarding`,
    );
    return new Response(null, { status: 200 });
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!shopRecord) {
    console.warn(`Shop record not found for domain ${shop}`);
    return new Response(null, { status: 200 });
  }

  const allowedProducts = await prisma.shopWbhookAllowedProducts.findMany({
    where: {
      shopId: shopRecord.id,
      productId: { in: productGraphqlIds },
    },
  });

  const selectedProductIds = new Set(allowedProducts.map((s) => s.productId));

  if (selectedProductIds.size === 0) {
    console.log(
      `Order ${order.id || order.name || ""} ignored: no allowed products for shop ${shop}`,
    );
    return new Response(null, { status: 200 });
  }

  console.log(
    `Order ${order.id || order.name || ""} will be forwarded (allowed products found) for shop ${shop}`,
  );


  const originalHeaders = Object.fromEntries(request.headers.entries());

  const hopByHopHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
  ]);

  const forwardHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(originalHeaders)) {
    const lowerKey = key.toLowerCase();
    if (hopByHopHeaders.has(lowerKey)) continue;

    if (lowerKey.startsWith("x-shopify-")) {
      forwardHeaders[key] = value;
    }
  }

  forwardHeaders["content-type"] = "application/json";

  const bodyString = JSON.stringify(payload);

  try {
    const externalResponse = await fetch(CARTFLOW_API_URL, {
      method: "POST",
      headers: forwardHeaders,
      body: bodyString,
    });

    if (!externalResponse.ok) {
      console.error(
        `External webhook call failed: ${externalResponse.status} ${externalResponse.statusText}`,
      );
    }
  } catch (err) {
    console.error("Error forwarding webhook to external endpoint:", err);
  }

  return new Response(null, { status: 200 });
};
