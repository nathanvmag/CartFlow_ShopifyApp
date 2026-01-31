import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const appCartFlowUrl = import.meta.env.VITE_APP_CARTFLOW_URL;

  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  return (
    <s-page heading="CartFlow">
      <s-section>
        <s-heading>👋 Bem-vindo ao CartFlow</s-heading>

        <s-paragraph>
          Conecte sua loja Shopify ao CartFlow para receber novos pedidos e
          enviar códigos de rastreio
        </s-paragraph>
      </s-section>

      <s-section heading="Como configurar">
        <s-ordered-list>
          <s-list-item>
            Vá em <strong>Produtos</strong> e selecione os produtos que devem
            ser enviados para a <strong>CartFlow</strong>.
          </s-list-item>

          <s-list-item>
            Vá em <strong>Configurações</strong> e copie as seguintes
            informações:
            <ul>
              <li>
                <strong>URL da Loja</strong> (ex:{" "}
                <code>minha-loja.myshopify.com</code>)
              </li>
              <li>
                <strong>Token de autenticação</strong> do CartFlow
              </li>
            </ul>
          </s-list-item>

          <s-list-item>
            Acesse o <strong>CartFlow</strong> e cadastre a URL da Loja e o
            Token de autenticação.
            <br />
            <s-text color="subdued">
              A partir desse momento, apenas <strong>novos pedidos</strong> da
              sua loja serão enviados automaticamente.
            </s-text>
          </s-list-item>

          <s-list-item>
            Após salvar as credenciais no CartFlow, utilize o botão{" "}
            <strong>Testar integração</strong> para validar a conexão.
          </s-list-item>
        </s-ordered-list>
      </s-section>

      <s-section heading="Próximos passos">
        <s-stack direction="inline" gap="base">
          <s-button variant="secondary" href="/app/settings">
            Ir para Configurações
          </s-button>

          <s-button variant="secondary" href="/app/products">
            Ir para Produtos
          </s-button>

          <s-button
            variant="primary"
            target="_blank"
            href={appCartFlowUrl || "#"}
          >
            Acessar CartFlow
          </s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Importante">
        <s-paragraph>
          🔒 O <strong>Token de autenticação</strong> é exclusivo da sua loja.
          Não compartilhe com terceiros fora do CartFlow.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
