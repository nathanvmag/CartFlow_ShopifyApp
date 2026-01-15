import { graphqlClientFromSession } from "app/admin-api.server";
import { HttpStatus } from "app/utils/http-responses.server";
import type { Session } from "@shopify/shopify-api";
import { toShopifyOrderGid } from "app/utils/string";

type FulfillmentOrder = {
  id: string;
  status: string;
};

type GetOrderFulfillmentOrdersResponse = {
  raw: unknown;
  fulfillmentOrders: FulfillmentOrder[];
};

const GET_ORDER_FULFILLMENT_ORDERS_QUERY = /* GraphQL */ `
  query GetOrderFulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      fulfillmentOrders(first: 10) {
        edges {
          node {
            id
            status
          }
        }
      }
    }
  }
`;

export async function getOrderFulfillmentOrdersService(
  session: Session,
  orderId: string,
): Promise<{
  status: HttpStatus;
  data?: GetOrderFulfillmentOrdersResponse;
  error?: string;
}> {
  try {
    const client = graphqlClientFromSession(session);

    const response = await client.request(GET_ORDER_FULFILLMENT_ORDERS_QUERY, {
      variables: {
        orderId: toShopifyOrderGid(orderId),
      },
    });

    const edges = response?.data?.order?.fulfillmentOrders?.edges ?? [];
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fulfillmentOrders = edges.map((edge: any) => edge.node);

    return {
      status: HttpStatus.OK,
      data: {
        raw: response,
        fulfillmentOrders,
      },
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Occurred an error while fetching fulfillment orders",
    };
  }
}
