import { authenticateExternalApiRequest } from "../../auth/authenticateExternalApiRequest";
import { graphqlClientFromSession } from "../../admin-api.server";
import { parseJsonBody } from "app/utils/json";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";
import { handleServiceError } from "app/utils/http-error";
import { toFulfillmentGid } from "app/utils/string";

type TrackingRequestBody = {
  company?: string;
  trackingUrl: string;
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

export async function updateFulfillmentService(request: Request, fulfillmentId: string) {
  try {
    const { session } = await authenticateExternalApiRequest(request);

    const body = await parseJsonBody<TrackingRequestBody>(request);

    const { trackingUrl, company, notifyCustomer } = body;

    if (!trackingUrl) {
      throw httpResponse({
        status: HttpStatus.BAD_REQUEST,
        message: "fulfillmentId and trackingUrl are required fields",
      });
    }

    const trackingInfoInput: Record<string, unknown> = {
      url: trackingUrl,
    };

    if (company) {
      trackingInfoInput.company = company;
    }

    const client = graphqlClientFromSession(session);

    const response = await client.request(FULFILLMENT_TRACKING_MUTATION, {
      variables: {
        fulfillmentId: toFulfillmentGid(fulfillmentId),
        trackingInfoInput,
        notifyCustomer: notifyCustomer || false,
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
