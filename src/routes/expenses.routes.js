import { Router } from "express";
import buildExpensesController from "../controllers/expenses.controller.js";

export default function buildExpensesRouter({ expenseRepo }) {
  if (!expenseRepo) throw new Error("expenseRepo es requerido en expenses.routes");

  const router = Router();
  const controller = buildExpensesController({ expenseRepo });

  router.post("/", controller.createExpense);
  router.get("/", controller.getExpenses);
  router.get("/:id", controller.getExpenseById);
  router.patch("/:id", controller.updateExpense);
  router.delete("/:id", controller.deleteExpense);

  return router;
}