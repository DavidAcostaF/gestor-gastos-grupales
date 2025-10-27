const { Router } = require('express');
const buildPaymentsController = require('../controllers/payments.controller');

module.exports = function buildPaymentsRouter({ paymentRepo }) {
  
  if (!paymentRepo) {
    throw new Error('paymentRepo es requerido en payments.routes');
  }

  const router = Router();
  
  const controller = buildPaymentsController({ paymentRepo });

  router.post('/', controller.createPayment);
  router.get('/', controller.getPayments);
  router.get('/:id', controller.getPaymentById);
  router.patch('/:id', controller.updatePayment);
  router.delete('/:id', controller.deletePayment);

  return router;
};