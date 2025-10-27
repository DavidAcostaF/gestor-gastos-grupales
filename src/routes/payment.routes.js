const { Router } = require("express");
const buildPaymentsController = require("../controllers/payments.controller");

module.exports = function buildPaymentsRouter({ paymentRepo, verifyToken }) {
  if (!paymentRepo) throw new Error("paymentRepo es requerido en payments.routes");
  if (!verifyToken) throw new Error("verifyToken es requerido en payments.routes");

  const router = Router();
  const controller = buildPaymentsController({ paymentRepo });

  router.use(verifyToken);

  router.post("/", controller.createPayment);
  router.get("/", controller.getPayments);
  router.get("/:id", controller.getPaymentById);
  router.patch("/:id", controller.updatePayment);
  router.delete("/:id", controller.deletePayment);

  return router;
};