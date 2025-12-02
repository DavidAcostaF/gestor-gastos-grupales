  import { Router } from "express";
import buildPaymentsController from "../controllers/payment.controller.js";

export default function buildPaymentsRouter({ paymentRepo }) {
  
  if (!paymentRepo) {

    throw new Error("paymentRepo es requerido en payments.routes");

  }

  const router = Router();
  const controller = buildPaymentsController({ paymentRepo });

  router.post("/", controller.createPayment);
  router.get("/", controller.getPayments);
  router.get("/:id", controller.getPaymentById);
  router.patch("/:id", controller.updatePayment);
  router.delete("/:id", controller.deletePayment);

  return router;

}