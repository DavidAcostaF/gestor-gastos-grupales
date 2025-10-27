import { Router } from "express";
import buildGroupsController from "../controllers/groups.controller.js";

export default function buildGroupsRouter({ groupRepo }) {
  if (!groupRepo) throw new Error("groupRepo es requerido en groups.routes");

  const router = Router();
  const controller = buildGroupsController({ groupRepo });

  router.post("/", controller.createGroup);
  router.get("/", controller.getGroups);
  router.get("/:id", controller.getGroupById);
  router.patch("/:id", controller.updateGroup);
  router.delete("/:id", controller.deleteGroup);

  return router;
}
