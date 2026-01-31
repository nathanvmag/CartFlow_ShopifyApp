import { graphqlClientFromSession } from "app/admin-api.server";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";

const PRODUCTS_QUERY = /* GraphQL */ `
  query ExternalFetchProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      edges {
        cursor
        node {
          id
          title
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                price
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export async function getAllProductsService(request: Request) {
  try {
    const { session } = await authenticate.admin(request);

    const url = new URL(request.url);
    const firstParam = url.searchParams.get("first");
    const afterParam = url.searchParams.get("after");

    const limit = firstParam ? parseInt(firstParam, 10) : 20;

    const client = graphqlClientFromSession(session);

    const response = await client.request(PRODUCTS_QUERY, {
      variables: {
        first: limit,
        after: afterParam,
      },
    });

    const edges = response.data.products.edges ?? [];

    const shopDomain = session.shop;

    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shopRecord) {
      return httpResponse({
        status: HttpStatus.UNAUTHORIZED,
        message: "Shop not found",
      });
    }

    let selectedProductIds = new Set<string>();

    const selections = await prisma.shopWbhookAllowedProducts.findMany({
      where: { shopId: shopRecord.id },
    });

    selectedProductIds = new Set(selections.map((s) => s.productId));

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = edges.map((edge: any) => {
      const node = edge.node;
      const firstVariant = node.variants?.edges?.[0]?.node;

      const productId: string = node.id;
      const initialSelected = selectedProductIds.has(productId);

      return {
        id: productId,
        title: node.title,
        imageUrl: node.featuredMedia?.preview?.image?.url ?? null,
        price: firstVariant?.price ?? null,
        initialSelected,
      };
    });

    const pageInfo = response.data.products.pageInfo;

    return Response.json(
      {
        products,
        pageInfo,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return httpResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch products",
    });
  }
}
