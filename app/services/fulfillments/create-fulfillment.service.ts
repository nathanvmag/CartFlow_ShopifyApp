import { graphqlClientFromSession } from "app/admin-api.server";
import { authenticateExternalApiRequest } from "app/auth/authenticateExternalApiRequest";
import { handleServiceError } from "app/utils/http-error";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { parseJsonBody } from "app/utils/json";
import { getOrderFulfillmentOrdersService } from "./get-order-fulfillment-orders";

type CreateFulfillmentRequestBody = {
  company?: string;
  trackingUrl: string;
  notifyCustomer?: boolean;
};

const FULFILLMENT_CREATE_MUTATION = /* GraphQL */ `
  mutation ExternalCreateFulfillmentWithTracking(
    $fulfillment: FulfillmentInput!
  ) {
    fulfillmentCreate(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
        trackingInfo {
          company
          number
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createFulfillmentService(request: Request, orderId: string) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const body = await parseJsonBody<CreateFulfillmentRequestBody>(request);

    const { trackingUrl, company, notifyCustomer } = body;

    if (!trackingUrl) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message: "orderId and trackingUrl are required fields",
      });
    }

    const fulfillmentData = await getOrderFulfillmentOrdersService(session, orderId);

    if (fulfillmentData.status !== HttpStatus.OK) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message: fulfillmentData.error || "Could not fetch fulfillment orders for the given orderId",
      });
    }

    if (fulfillmentData.data!.fulfillmentOrders.length === 0) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message: "No fulfillment orders found for the given orderId",
      });
    }

    const fulfillmentOrderId = fulfillmentData.data!.fulfillmentOrders[0].id;

    const trackingInfo: Record<string, unknown> = {
      url: trackingUrl,
    };

    if (company) {
      trackingInfo.company = company;
    }

    const client = graphqlClientFromSession(session);

    const response = await client.request(FULFILLMENT_CREATE_MUTATION, {
      variables: {
        fulfillment: {
          lineItemsByFulfillmentOrder: [{ fulfillmentOrderId }],
          trackingInfo,
          notifyCustomer: notifyCustomer || false,
        },
      },
    });

    return httpResponse({
      status: HttpStatus.OK,
      data: response,
    });
  } catch (err) {
    return handleServiceError(err);
  }
}
