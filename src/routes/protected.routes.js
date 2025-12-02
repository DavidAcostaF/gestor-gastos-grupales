import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.json({ mensaje: "Esta es una ruta protegida.", userId: req.user.id });
});

export default router;
