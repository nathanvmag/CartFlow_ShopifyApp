import { graphqlClientFromSession } from "app/admin-api.server";
import { authenticateExternalApiRequest } from "app/auth/authenticateExternalApiRequest";
import { handleServiceError } from "app/utils/http-error";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { parseJsonBody } from "app/utils/json";

type CreateFulfillmentRequestBody = {
  fulfillmentOrderId: string;
  company: string;
  number: string;
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

export async function createFulfillmentService(request: Request) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const body = await parseJsonBody<CreateFulfillmentRequestBody>(request);

    const { fulfillmentOrderId, company, number, notifyCustomer } = body;

    if (!fulfillmentOrderId || !company || !number) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message:
          "fulfillmentOrderId, company and number are required fields",
      });
    }

    const client = graphqlClientFromSession(session);

    const response = await client.request(FULFILLMENT_CREATE_MUTATION, {
      variables: {
        fulfillment: {
          lineItemsByFulfillmentOrder: [{ fulfillmentOrderId }],
          trackingInfo: { company, number },
          notifyCustomer: notifyCustomer ?? false,
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
