import { useEffect, useState } from "react";

type ProductNode = {
  id: string;
  title: string;
  imageUrl?: string | null;
  price?: string | null;
  initialSelected: boolean;
};

type ProductsResponse = {
  products: ProductNode[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor: string | null;
  };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [pageInfo, setPageInfo] = useState<ProductsResponse["pageInfo"]>({
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  });

  const pageSize = 20;

  async function loadProducts(after?: string | null) {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("first", String(pageSize));
    if (after) {
      params.set("after", after);
    }

    const res = await fetch(`/api/products?${params.toString()}`);
    if (!res.ok) {
      console.error("Erro ao carregar produtos");
      setLoading(false);
      return;
    }

    const data: ProductsResponse = await res.json();

    if (after) {
      setProducts((prev) => [...prev, ...data.products]);
    } else {
      setProducts(data.products);
    }

    setSelectedIds((prev) => {
      const next = after ? new Set(prev) : new Set<string>();

      for (const p of data.products) {
        if (p.initialSelected) {
          next.add(p.id);
        }
      }
      return next;
    });

    setPageInfo(data.pageInfo);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function toggleProductSelection(productId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function isSelected(productId: string) {
    return selectedIds.has(productId);
  }

  async function handleLoadMore() {
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      await loadProducts(pageInfo.endCursor);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const setTrueIds: string[] = [];
      const setFalseIds: string[] = [];

      for (const product of products) {
        const isSelectedNow = selectedIds.has(product.id);
        const wasSelectedBefore = product.initialSelected;

        if (isSelectedNow !== wasSelectedBefore) {
          if (isSelectedNow) {
            setTrueIds.push(product.id);
          } else {
            setFalseIds.push(product.id);
          }
        }
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setTrueIds, setFalseIds }),
      });

      if (!res.ok) {
        shopify.toast.show("Erro ao salvar produtos", {
          duration: 3000,
          isError: true,
        });
      } else {
        await loadProducts();
        shopify.toast.show("Produtos salvos com sucesso", { duration: 3000 });
      }
    } catch (error) {
      shopify.toast.show("Erro ao salvar produtos", {
        duration: 3000,
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <s-page heading="Produtos">
      <s-section heading="Produtos permitidos para envio à CartFlow">
        <div style={{ padding: "16px" }}>
          <s-stack gap="large">
            <s-text color="subdued">
              Selecione os produtos que autorizam o envio do pedido para a
              CartFlow.
              <br />
              Se o pedido contiver ao menos um dos produtos selecionados, ele
              será enviado completo, mantendo todos os dados corretos.
            </s-text>
          </s-stack>

          <s-stack
            direction="inline"
            justifyContent="end"
            gap="base"
            alignContent="end"
            alignItems="end"
            padding="large"
          >
            <s-button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={saving || loading}
              loading={saving || loading}
            >
              Salvar seleção
            </s-button>
          </s-stack>

          {loading && products.length === 0 ? (
            <p>Carregando produtos...</p>
          ) : (
            <>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "16px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px" }}>
                      Selecionar
                    </th>
                    <th style={{ textAlign: "left", padding: "8px" }}>
                      Produto
                    </th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Preço</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>
                      Imagem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const price = product.price ?? "-";
                    return (
                      <tr key={product.id}>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td style={{ padding: "8px" }}>{product.title}</td>
                        <td style={{ padding: "8px" }}>{price}</td>
                        <td style={{ padding: "8px" }}>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              style={{
                                width: "48px",
                                height: "48px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                          ) : (
                            <span>Sem imagem</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <s-stack
                direction="inline"
                justifyContent="center"
                gap="base"
                alignContent="center"
                alignItems="center"
                padding="large"
              >
                {pageInfo.hasNextPage && (
                  <s-button
                    type="button"
                    variant="secondary"
                    onClick={handleLoadMore}
                    disabled={saving || loading}
                    loading={saving || loading}
                  >
                    Carregar mais
                  </s-button>
                )}

                <s-button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || loading}
                  loading={saving || loading}
                >
                  Salvar seleção
                </s-button>
              </s-stack>
            </>
          )}
        </div>
      </s-section>

      <s-section slot="aside" heading="Importante">
        <s-paragraph>
          Quando um pedido contiver ao menos{" "}
          <strong>1 produto permitido</strong> para envio à{" "}
          <strong>CartFlow</strong>, <strong>todo o pedido</strong> será
          enviado.
          <br />
          <s-text color="subdued">
            Isso garante que os dados do pedido permaneçam completos e
            consistentes.
          </s-text>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
