import { authenticateExternalApiRequest } from "../../auth/authenticateExternalApiRequest";
import { graphqlClientFromSession } from "../../admin-api.server";
import { parseJsonBody } from "app/utils/json";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { handleServiceError } from "app/utils/http-error";

type TrackingRequestBody = {
  fulfillmentId: string;
  company: string;
  number: string;
  notifyCustomer?: boolean;
};

const FULFILLMENT_TRACKING_MUTATION = /* GraphQL */ `
  mutation ExternalUpdateFulfillmentTracking(
    $fulfillmentId: ID!
    $trackingInfoInput: FulfillmentTrackingInput!
    $notifyCustomer: Boolean
  ) {
    fulfillmentTrackingInfoUpdate(
      fulfillmentId: $fulfillmentId
      trackingInfoInput: $trackingInfoInput
      notifyCustomer: $notifyCustomer
    ) {
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

export async function updateFulfillmentService(request: Request) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const body = await parseJsonBody<TrackingRequestBody>(request);

    const { fulfillmentId, company, number, notifyCustomer } = body;

    if (!fulfillmentId || !company || !number) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message:
          "fulfillmentId, company and number are required fields",
      });
    }

    const client = graphqlClientFromSession(session);

    const response = await client.request(FULFILLMENT_TRACKING_MUTATION, {
      variables: {
        fulfillmentId,
        notifyCustomer: notifyCustomer ?? false,
        trackingInfoInput: {
          company,
          number,
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