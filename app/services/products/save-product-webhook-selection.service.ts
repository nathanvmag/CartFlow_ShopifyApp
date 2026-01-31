import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { httpResponse, HttpStatus } from "app/utils/http-responses.server";

type SaveSelectionBody = {
  setTrueIds: string[];
  setFalseIds: string[];
};

export async function saveProductWebhookSelectionService(request: Request) {
  try {
    const { session } = await authenticate.admin(request);

    const shopDomain = session.shop;

    const body = (await request.json()) as SaveSelectionBody;

    const shopRecord = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shopRecord) {
      return httpResponse({
        status: HttpStatus.UNAUTHORIZED,
        message: "Shop not found",
      });
    }

    const setTrueIds = Array.isArray(body.setTrueIds) ? body.setTrueIds : [];
    const setFalseIds = Array.isArray(body.setFalseIds) ? body.setFalseIds : [];

    if (setTrueIds.length > 0) {
      await prisma.$transaction(
        setTrueIds.map((productId) =>
          prisma.shopWbhookAllowedProducts.upsert({
            where: {
              shopId_productId: {
                shopId: shopRecord.id,
                productId,
              },
            },
            update: {},
            create: {
              shopId: shopRecord.id,
              productId,
            },
          }),
        ),
      );
    }

    if (setFalseIds.length > 0) {
      await prisma.shopWbhookAllowedProducts.deleteMany({
        where: {
          shopId: shopRecord.id,
          productId: { in: setFalseIds },
        },
      });
    }

    return Response.json(
      {
        success: true,
        updatedTrue: setTrueIds.length,
        updatedFalse: setFalseIds.length,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      console.error(
        "Erro ao salvar configurações de produtos:",
        error.statusText,
      );
      return error;
    }

    return httpResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to save product webhook selection",
    });
  }
}
