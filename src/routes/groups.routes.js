import { Router } from "express";
import buildGroupsController from "../controllers/groups.controller.js";

export default function buildGroupsRouter({ groupRepo, expenseRepo, paymentRepo, userRepo }) {
  if (!groupRepo) throw new Error("groupRepo es requerido en groups.routes");

  const router = Router();
  const controller = buildGroupsController({ groupRepo, expenseRepo, paymentRepo, userRepo });

  router.post("/", controller.createGroup);
  router.get("/", controller.getGroups);
  router.get("/:id", controller.getGroupById);
  router.patch("/:id", controller.updateGroup);
  router.delete("/:id", controller.deleteGroup);

  // Rutas para gestionar participantes
  router.post("/:id/participants", controller.addParticipant);
  router.delete("/:id/participants/:userId", controller.removeParticipant);

  // Ruta para calcular deudas/balances
  router.get("/:id/balances", controller.calculateBalances);

  return router;
}
