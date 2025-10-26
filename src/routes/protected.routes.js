const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.json({ mensaje: "Esta es una ruta protegida.", userId: req.user.id });
});

module.exports = router;
