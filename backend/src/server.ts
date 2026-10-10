import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import { comparePassword, hashPassword, requireAuth, requireRole, signToken } from "./auth";
import {
  calculateWastagePct,
  getTrafficStatus,
  validateNonNegativeNumber,
  validatePositiveInteger
} from "./business";
import type { AuthRequest } from "./types";
import { UserRole, OrderStatus, VerificationDecision } from "@prisma/client";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((value) => value.trim()) || true
  })
);
app.use(express.json({ limit: "1mb" }));

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

function requireNumberBody(value: unknown, field: string): number {
  if (typeof value !== "number") throw new Error(`${field} must be numeric.`);
  return value;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "apparelflow-gatekeeper-api" });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    return res.json({ token: signToken(safeUser), user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: errorMessage(error) });
  }
});

app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.get(
  "/api/recipes",
  requireAuth,
  requireRole(UserRole.CUTTING_SUPERVISOR, UserRole.CUTTING_VERIFIER, UserRole.SEWING_SUPERVISOR),
  async (_req, res) => {
    const recipes = await prisma.recipe.findMany({
      include: { components: true },
      orderBy: { name: "asc" }
    });
    res.json(recipes);
  }
);

app.get(
  "/api/orders",
  requireAuth,
  requireRole(UserRole.CUTTING_SUPERVISOR),
  async (req: AuthRequest, res) => {
    const orders = await prisma.cuttingOrder.findMany({
      where: { createdBy: req.user!.id },
      include: {
        recipe: { include: { components: true } },
        verificationItems: { include: { component: true } },
        verificationLogs: { include: { verifier: { select: { fullName: true, email: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  }
);

app.post(
  "/api/orders",
  requireAuth,
  requireRole(UserRole.CUTTING_SUPERVISOR),
  async (req: AuthRequest, res) => {
    try {
      const { recipeId, targetQty, fabricRollId, actualFabricYds } = req.body ?? {};

      validatePositiveInteger(recipeId, "recipeId");
      validatePositiveInteger(targetQty, "targetQty");
      validateNonNegativeNumber(actualFabricYds, "actualFabricYds");

      if (typeof fabricRollId !== "string" || !fabricRollId.trim()) {
        return res.status(400).json({ message: "Fabric Roll ID is required." });
      }

      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: { components: true }
      });

      if (!recipe) return res.status(404).json({ message: "Recipe not found." });

      const expectedFabric = recipe.stdFabricYards * targetQty;
      const wastagePct = calculateWastagePct(actualFabricYds, expectedFabric);

      const orderNo = `ORD-${Date.now().toString().slice(-8)}`;

      const order = await prisma.cuttingOrder.create({
        data: {
          orderNo,
          recipeId,
          targetQty,
          fabricRollId: fabricRollId.trim(),
          actualFabricYds,
          status: OrderStatus.PENDING_VERIFICATION,
          createdBy: req.user!.id,
          verificationItems: {
            create: recipe.components.map((component) => ({
              componentId: component.id,
              expectedQty: targetQty * component.piecesPerGarment,
              actualQty: 0,
              status: "RED"
            }))
          }
        },
        include: {
          recipe: { include: { components: true } },
          verificationItems: { include: { component: true } }
        }
      });

      return res.status(201).json({
        ...order,
        expectedFabric,
        wastagePct
      });
    } catch (error) {
      return res.status(400).json({ message: errorMessage(error) });
    }
  }
);

app.get(
  "/api/orders/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid order id." });

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: { include: { components: true } },
        verificationItems: { include: { component: true } },
        verificationLogs: {
          include: { verifier: { select: { fullName: true, email: true, role: true } } }
        }
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found." });

    if (
      req.user!.role === UserRole.CUTTING_SUPERVISOR &&
      order.createdBy !== req.user!.id
    ) {
      return res.status(403).json({ message: "You cannot access this order." });
    }

    if (
      req.user!.role === UserRole.SEWING_SUPERVISOR &&
      order.status !== OrderStatus.VERIFIED &&
      order.status !== OrderStatus.SEWING_IN_PROGRESS &&
      order.status !== OrderStatus.COMPLETED
    ) {
      return res.status(403).json({ message: "Unverified order is not visible to Sewing." });
    }

    res.json(order);
  }
);

app.get(
  "/api/verifications/pending",
  requireAuth,
  requireRole(UserRole.CUTTING_VERIFIER),
  async (_req, res) => {
    const orders = await prisma.cuttingOrder.findMany({
      where: { status: OrderStatus.PENDING_VERIFICATION },
      include: {
        recipe: true,
        verificationItems: { include: { component: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(orders);
  }
);

app.get(
  "/api/verifications/:orderId",
  requireAuth,
  requireRole(UserRole.CUTTING_VERIFIER),
  async (req, res) => {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

    const order = await prisma.cuttingOrder.findUnique({
      where: { id: orderId },
      include: {
        recipe: { include: { components: true } },
        verificationItems: { include: { component: true } }
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  }
);

app.post(
  "/api/verifications/:orderId/counts",
  requireAuth,
  requireRole(UserRole.CUTTING_VERIFIER),
  async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

      const counts = req.body?.counts;
      if (!Array.isArray(counts) || counts.length === 0) {
        return res.status(400).json({ message: "Counts array is required." });
      }

      const order = await prisma.cuttingOrder.findUnique({
        where: { id: orderId },
        include: { verificationItems: true }
      });

      if (!order) return res.status(404).json({ message: "Order not found." });
      if (order.status !== OrderStatus.PENDING_VERIFICATION) {
        return res.status(409).json({ message: "Order is not awaiting verification." });
      }

      const byComponent = new Map<number, number>();
      for (const item of counts) {
        const componentId = requireNumberBody(item.componentId, "componentId");
        const actualQty = requireNumberBody(item.actualQty, "actualQty");
        validateNonNegativeNumber(actualQty, "actualQty");
        if (!Number.isInteger(actualQty)) throw new Error("actualQty must be a whole number.");
        byComponent.set(componentId, actualQty);
      }

      const updated = await prisma.$transaction(
        order.verificationItems.map((item) => {
          const actualQty = byComponent.get(item.componentId);
          if (actualQty === undefined) {
            return prisma.verificationItem.update({
              where: { id: item.id },
              data: { actualQty: 0, status: "RED" }
            });
          }

          return prisma.verificationItem.update({
            where: { id: item.id },
            data: {
              actualQty,
              status: getTrafficStatus(item.expectedQty, actualQty)
            }
          });
        })
      );

      return res.json(updated);
    } catch (error) {
      return res.status(400).json({ message: errorMessage(error) });
    }
  }
);

app.post(
  "/api/verifications/:orderId/approve",
  requireAuth,
  requireRole(UserRole.CUTTING_VERIFIER),
  async (req: AuthRequest, res) => {
    try {
      const orderId = Number(req.params.orderId);
      if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

      const order = await prisma.cuttingOrder.findUnique({
        where: { id: orderId },
        include: {
          recipe: true,
          verificationItems: true
        }
      });

      if (!order) return res.status(404).json({ message: "Order not found." });
      if (order.status !== OrderStatus.PENDING_VERIFICATION) {
        return res.status(409).json({ message: "Order is not awaiting verification." });
      }

      // Server-side hard stop: never trust client status.
      if (
        order.verificationItems.length === 0 ||
        order.verificationItems.some(
          (item) =>
            item.actualQty < 0 ||
            item.status === "RED" ||
            item.actualQty === null ||
            item.actualQty === undefined
        )
      ) {
        return res.status(422).json({
          message: "Approval blocked: every component must be counted and no component may be RED."
        });
      }

      const missingCount = order.verificationItems.some(
        (item) => item.actualQty < item.expectedQty
      );
      if (missingCount) {
        return res.status(422).json({
          message: "Approval blocked: one or more components have a shortage."
        });
      }

      const expectedFabric = order.recipe.stdFabricYards * order.targetQty;
      const wastagePct = calculateWastagePct(order.actualFabricYds, expectedFabric);

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.cuttingOrder.update({
          where: { id: orderId },
          data: { status: OrderStatus.VERIFIED }
        });

        await tx.verificationLog.create({
          data: {
            orderId,
            verifierId: req.user!.id,
            decision: VerificationDecision.APPROVED,
            wastagePct,
            rejectionNote: null
          }
        });

        return updated;
      });

      return res.json({
        message: "Batch verified and released to Sewing Queue.",
        order: result,
        wastagePct
      });
    } catch (error) {
      return res.status(400).json({ message: errorMessage(error) });
    }
  }
);

app.post(
  "/api/verifications/:orderId/reject",
  requireAuth,
  requireRole(UserRole.CUTTING_VERIFIER),
  async (req: AuthRequest, res) => {
    try {
      const orderId = Number(req.params.orderId);
      const rejectionNote =
        typeof req.body?.rejectionNote === "string" ? req.body.rejectionNote.trim() : "";

      if (!rejectionNote) {
        return res.status(400).json({ message: "A rejection reason is mandatory." });
      }

      const order = await prisma.cuttingOrder.findUnique({
        where: { id: orderId },
        include: { recipe: true }
      });

      if (!order) return res.status(404).json({ message: "Order not found." });
      if (order.status !== OrderStatus.PENDING_VERIFICATION) {
        return res.status(409).json({ message: "Order is not awaiting verification." });
      }

      const expectedFabric = order.recipe.stdFabricYards * order.targetQty;
      const wastagePct = calculateWastagePct(order.actualFabricYds, expectedFabric);

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.cuttingOrder.update({
          where: { id: orderId },
          data: { status: OrderStatus.REJECTED }
        });

        await tx.verificationLog.create({
          data: {
            orderId,
            verifierId: req.user!.id,
            decision: VerificationDecision.REJECTED,
            rejectionNote,
            wastagePct
          }
        });

        return updated;
      });

      return res.json({ message: "Batch rejected and returned for re-cutting.", order: result });
    } catch (error) {
      return res.status(400).json({ message: errorMessage(error) });
    }
  }
);

app.get(
  "/api/sewing/queue",
  requireAuth,
  requireRole(UserRole.SEWING_SUPERVISOR),
  async (_req, res) => {
    // Query isolation: only VERIFIED records can enter this queue.
    const queue = await prisma.cuttingOrder.findMany({
      where: {
        status: OrderStatus.VERIFIED
      },
      include: {
        recipe: true,
        verificationItems: { include: { component: true } },
        verificationLogs: {
          where: { decision: VerificationDecision.APPROVED },
          include: { verifier: { select: { fullName: true, email: true } } },
          orderBy: { timestamp: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "asc" }
    });

    res.json(queue);
  }
);

app.post(
  "/api/sewing/:orderId/start",
  requireAuth,
  requireRole(UserRole.SEWING_SUPERVISOR),
  async (req, res) => {
    try {
      const orderId = Number(req.params.orderId);
      if (!Number.isInteger(orderId)) return res.status(400).json({ message: "Invalid order id." });

      const order = await prisma.cuttingOrder.findUnique({ where: { id: orderId } });

      if (!order) return res.status(404).json({ message: "Order not found." });
      if (order.status !== OrderStatus.VERIFIED) {
        return res.status(422).json({ message: "Only VERIFIED batches can start sewing." });
      }

      const updated = await prisma.cuttingOrder.update({
        where: { id: orderId },
        data: { status: OrderStatus.SEWING_IN_PROGRESS }
      });

      return res.json({ message: "Sewing assembly started.", order: updated });
    } catch (error) {
      return res.status(400).json({ message: errorMessage(error) });
    }
  }
);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

export { app };
export default app;

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => {
    console.log(`ApparelFlow API running on http://localhost:${port}`);
  });
}
