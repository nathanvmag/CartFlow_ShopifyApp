import { useEffect, useState } from "react";

type SettingsInfoResponse = {
  shop: string;
  alreadyViewed: boolean;
};

type RotateTokenResponse = {
  token: string;
};

export default function SettingsPage() {
  const appCartFlowUrl = import.meta.env.VITE_APP_CARTFLOW_URL;

  const [shop, setShop] = useState("");
  const [shopCopied, setShopCopied] = useState(false);

  const [token, setToken] = useState("");

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingTokenAction, setLoadingTokenAction] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      setLoadingInfo(true);
      try {
        const res = await fetch("/api/settings/info");
        if (!res.ok) {
          setLoadingInfo(false);
          return;
        }

        const data: SettingsInfoResponse = await res.json();
        setShop(data.shop);
      } catch (e) {
        shopify.toast.show("Erro ao carregar informações", { duration: 3000, isError: true });
      } finally {
        setLoadingInfo(false);
      }
    };

    loadInfo();
  }, []);

  const copyShop = async () => {
    if (!shop) return;

    await navigator.clipboard.writeText(shop);
    setShopCopied(true);
    setTimeout(() => setShopCopied(false), 2000);
  };

  const rotateToken = async () => {
    setLoadingTokenAction(true);
    try {
      const res = await fetch("/api/settings/rotate-token", {
        method: "POST",
      });

      if (!res.ok) {
        shopify.toast.show("Erro ao rotacionar token", { duration: 3000, isError: true });
        setLoadingTokenAction(false);
        return;
      }

      const data: RotateTokenResponse = await res.json();

      setToken(data.token);
      shopify.toast.show("Token rotacionado", { duration: 3000 });
    } catch (e) {
      shopify.toast.show(`Erro ao rotacionar token`, { duration: 3000, isError: true });
    } finally {
      setLoadingTokenAction(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;

    await navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const isLoading = loadingInfo || loadingTokenAction;

  return (
    <s-page heading="Configurações">
      <s-section heading="Loja Shopify">
        <s-paragraph>
          Esta é a URL da sua loja Shopify. Use-a para identificar sua loja ao
          configurar integrações externas.
        </s-paragraph>

        <s-stack>
          <s-text-field
            label="URL da loja"
            value={shop}
            help-text="Use este valor como identificador da loja (shop)."
            icon="store"
            readOnly
          />

          <s-box padding="base base base none">
            <s-stack direction="inline" gap="base">
              <s-button
                variant="secondary"
                disabled={!shop}
                onClick={copyShop}
                icon={shopCopied ? "check" : "clipboard"}
              >
                {shopCopied ? "Copiado" : "Copiar URL da loja"}
              </s-button>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Token de Autenticação">
        <s-paragraph>
          Use este token, junto com a URL da loja, para autenticar seu sistema
          externo ao se comunicar com este app.
        </s-paragraph>

        <s-stack>
          <s-text-field
            label="Token de autenticação"
            value={token}
            help-text="Este token será exibido apenas uma vez; copie e armazene com segurança."
            icon="key"
            readOnly
          />

          <s-box padding="base base base none">
            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                loading={isLoading}
                onClick={rotateToken}
              >
                Gerar novo token
              </s-button>

              <s-button
                variant="secondary"
                disabled={!token}
                onClick={copyToken}
                icon={tokenCopied ? "check" : "clipboard"}
              >
                {tokenCopied ? "Copiado" : "Copiar token"}
              </s-button>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section>
        <s-stack direction="block" gap="base">
          <s-heading>CartFlow</s-heading>

          <s-paragraph>
            Acesse o CartFlow para cadastrar sua loja e testar a integração.
          </s-paragraph>

          <s-stack direction="inline" gap="base">
            <s-button
              variant="primary"
              target="_blank"
              href={appCartFlowUrl || "#"}
            >
              Acessar CartFlow
            </s-button>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Importante">
        <s-stack direction="block" gap="base">
          <s-paragraph>Trate este token como uma senha.</s-paragraph>

          <s-paragraph>
            Ele é exibido apenas neste momento. Ao sair da página, não será
            possível visualizá-lo novamente.
          </s-paragraph>

          <s-paragraph>
            Caso perca as credenciais ou suspeite de comprometimento, utilize o
            botão <strong>“Gerar novo token”</strong> para criar um novo.
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}
