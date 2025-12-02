import { Router } from "express";
import buildUsersController from "../controllers/users.controller.js";

export default function buildUsersRouter({ userRepo, verifyToken }) {
  if (!userRepo) throw new Error("userRepo es requerido en users.routes");

  const router = Router();
  const controller = buildUsersController({ userRepo });

  router.post("/", controller.createUser);

  // A partir de aquí, todos requieren token
  router.use(verifyToken);

  router.get("/", controller.getUsers);
  router.get("/:id", controller.getUserById);
  router.patch("/:id", controller.updateUser);
  router.delete("/:id", controller.deleteUser);

  return router;
}
