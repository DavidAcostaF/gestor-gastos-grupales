import { Router } from "express";
import buildBudgetsController from "../controllers/budgets.controller.js";

export default function buildBudgetsRouter({ budgetRepo, verifyToken }) {
  if (!budgetRepo) {
    throw new Error("budgetRepo es requerido en budget.routes");
  }

  const router = Router();
  const controller = buildBudgetsController({ budgetRepo });

  // Aplicar middleware de autenticación a todas las rutas
  router.use(verifyToken);

  router.post("/", controller.createBudget);
  router.get("/", controller.getBudgets);
  router.get("/:id", controller.getBudgetById);
  router.patch("/:id", controller.updateBudget);
  router.delete("/:id", controller.deleteBudget);

  return router;
}
