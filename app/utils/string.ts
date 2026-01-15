export function toShopifyOrderGid(id: string | number): string {
  return `gid://shopify/Order/${id}`;
}

export function toFulfillmentGid(id: string | number): string {
  return `gid://shopify/Fulfillment/${id}`;
}
