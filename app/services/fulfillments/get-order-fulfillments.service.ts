import { graphqlClientFromSession } from "app/admin-api.server";
import { handleServiceError } from "app/utils/http-error";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { authenticateExternalApiRequest } from "app/auth/authenticateExternalApiRequest";
import { toShopifyOrderGid } from "app/utils/string";

const GET_ORDER_FULFILLMENTS_QUERY = /* GraphQL */ `
  query GetOrderFulfillments($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      fulfillments(first: 10) {
        id
        status
        trackingInfo(first: 10) {
          company
          number
          url
        }
        location {
          id
        }
      }
    }
  }
`;

export async function getOrderFulfillmentsService(
  request: Request,
  orderId: string,
) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const client = graphqlClientFromSession(session);

    const response = await client.request(GET_ORDER_FULFILLMENTS_QUERY, {
      variables: {
        orderId: toShopifyOrderGid(orderId),
      },
    });

    // Atenção: depende de como o seu client GraphQL devolve o response:
    // - alguns retornam { data: { order: ... } }
    // - outros retornam direto { order: ... }
    //
    // Pelo teu uso anterior ("response?.data?.order"), vou manter o padrão com data.
    const order = response?.data?.order;

    const fulfillments = order?.fulfillments ?? [];

    return httpResponse({
      status: HttpStatus.OK,
      data: fulfillments,
    });
  } catch (err) {
    return handleServiceError(err);
  }
}
