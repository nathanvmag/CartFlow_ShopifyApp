import { graphqlClientFromSession } from "app/admin-api.server";
import { authenticateExternalApiRequest } from "../../auth/authenticateExternalApiRequest";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";

const ORDERS_QUERY = /* GraphQL */ `
  query ExternalFetchOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        displayFinancialStatus
        displayFulfillmentStatus
        createdAt
      }
    }
  }
`;

export async function getAllOrdersService(request: Request) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const url = new URL(request.url);
    const firstParam = url.searchParams.get("first");
    const limit = firstParam ? parseInt(firstParam, 10) : 10;

    const client = graphqlClientFromSession(session);

    const response = await client.request(ORDERS_QUERY, {
      variables: {
        first: limit,
      },
    });

    return Response.json(response.data, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return httpResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch orders",
    });
  }
}
