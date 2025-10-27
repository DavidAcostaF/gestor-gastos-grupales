export default function buildPaymentsController({ paymentRepo }) {
  if (!paymentRepo) {
    throw new Error("paymentRepo es requerido en payments.controller");
  }

  return {
    /**
     * @route POST /api/v1/payments
     * @desc Crea un nuevo pago
     */
    createPayment: async (req, res, next) => {
      try {
        const {
          groupId,
          userId,
          amount,
          method,
          date,
          reference,
          receiptUrl,
          note,
          status,
          approvedBy,
          approvedAt,
        } = req.body || {};

          if (!groupId || !userId || !amount || !method) {
          const err = new Error(
            "groupId, userId, amount y method son obligatorios"
          );
          err.status = 400;
          throw err;
        }

        const now = new Date();
        const doc = {
          groupId,
          userId,
          amount,
          method,
          date: date ? new Date(date) : now,
          reference: reference || "",
          receiptUrl: receiptUrl || "",
          note: note || "",
          status: status || "pending",
          approvedBy: approvedBy || null,
          approvedAt: approvedAt || null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const id = await paymentRepo.create(doc);
        const created = await paymentRepo.getById(id);

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    },

    /**
     * @route GET /api/v1/payments
     * @desc Obtiene todos los pagos (con filtros)
     */
    getPayments: async (req, res, next) => {
      try {
        const filter = {};
        if (req.query.groupId) filter.groupId = req.query.groupId;
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.status) filter.status = req.query.status;

        const payments = await paymentRepo.getAll(filter);
        res.json({ success: true, data: payments });
      } catch (error) {
        next(error);
      }
    },

    /**
     * @route GET /api/v1/payments/:id
     * @desc Obtiene un pago por ID
     */
    getPaymentById: async (req, res, next) => {
      try {
        const payment = await paymentRepo.getById(req.params.id);
        if (!payment) {
          const err = new Error("Pago no encontrado");
          err.status = 404;
          throw err;
        }
        res.json({ success: true, data: payment });
      } catch (error) {
        next(error);
      }
    },

    /**
     * @route PATCH /api/v1/payments/:id
     * @desc Actualiza un pago
     */
    updatePayment: async (req, res, next) => {
      try {
        const updateFields = { ...req.body, updatedAt: new Date() };
        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;
        delete updateFields.userId;
        delete updateFields.groupId;

        const ok = await paymentRepo.update(req.params.id, updateFields);
        if (!ok) {
          const err = new Error("Pago no encontrado o no actualizado");
          err.status = 404;
          throw err;
        }
        const updated = await paymentRepo.getById(req.params.id);
        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    },

    /**
     * @route DELETE /api/v1/payments/:id
     * @desc Elimina un pago
     */
    deletePayment: async (req, res, next) => {
      try {
        const ok = await paymentRepo.delete(req.params.id);
        if (!ok) {
          const err = new Error("Pago no encontrado o no eliminado");
          err.status = 404;
          throw err;
        }
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}