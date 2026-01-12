import { useEffect, useState } from "react";

type SettingsInfoResponse = {
  shop: string;
  alreadyViewed: boolean;
};

type RotateTokenResponse = {
  token: string;
};

export default function SettingsPage() {
  const [shop, setShop] = useState("");
  const [shopCopied, setShopCopied] = useState(false);

  const [token, setToken] = useState("");

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingTokenAction, setLoadingTokenAction] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Carrega info inicial (shop + status do token)
  useEffect(() => {
    const loadInfo = async () => {
      setLoadingInfo(true);
      try {
        const res = await fetch("/api/settings/info");
        if (!res.ok) {
          // tratar erro se quiser
          setLoadingInfo(false);
          return;
        }

        const data: SettingsInfoResponse = await res.json();
        setShop(data.shop);
      } catch (e) {
        // tratar erro
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
        // tratar erro
        setLoadingTokenAction(false);
        return;
      }

      const data: RotateTokenResponse = await res.json();

      setToken(data.token);
    } catch (e) {
      // tratar erro
    }
    finally {
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
      {/* Seção da URL da loja */}
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

      {/* Seção do token da plataforma */}
      <s-section heading="Token de Integração">
        <s-paragraph>
          Use este token, junto com a URL da loja, para autenticar seu sistema
          externo ao se comunicar com este app.
        </s-paragraph>

        <s-stack>
          <s-text-field
            label="Token de integração"
            value={token}
            help-text="Este token será exibido apenas uma vez; copie e armazene com segurança."
            icon="key"
            readOnly
          />

          <s-box padding="base base base none">
            <s-stack direction="inline" gap="base">
              {/* Botão principal: Ver ou Rotacionar, dependendo se já foi visto */}
              <s-button
                variant="primary"
                loading={isLoading}
                onClick={rotateToken}
              >
                Gerar novo token
              </s-button>

              {/* Botão de copiar token */}
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

      <s-section slot="aside" heading="Importante">
        <s-paragraph>
          Trate este token como uma senha. Não compartilhe com terceiros sem
          necessidade. Se suspeitar de vazamento, utilize o botão
          &quot;Rotacionar token&quot; para gerar um novo.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
