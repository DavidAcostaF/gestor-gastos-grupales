const { ObjectId } = require("mongodb");

module.exports = function buildPaymentsController({ paymentRepo }) {
  if (!paymentRepo) {
    throw new Error("paymentRepo es requerido en payments.controller");
  }

  return {
    createPayment: async (req, res, next) => {
      try {
        const { groupId, amount, method, date, reference, receiptUrl, note } =
          req.body;
        const userId = req.user.id;

        if (!groupId || !amount || !method) {
          const err = new Error("groupId, amount y method son obligatorios");
          err.status = 400;
          throw err;
        }

        const now = new Date();
        const newPayment = {
          groupId,
          userId,
          amount,
          date: date ? new Date(date) : new Date(),
          method,
          reference: reference || "",
          receiptUrl: receiptUrl || "",
          note: note || "",
          status: "pending",
          approvedBy: null,
          approvedAt: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const insertedId = await paymentRepo.create(newPayment);
        const created = await paymentRepo.getById(insertedId);
        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    },

    getPayments: async (req, res, next) => {
      try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.groupId) filter.groupId = new ObjectId(req.query.groupId);
        if (req.query.userId) filter.userId = new ObjectId(req.query.userId);

        const payments = await paymentRepo.getAll(filter);
        return res.json({ success: true, data: payments });
      } catch (error) {
        next(error);
      }
    },

    getPaymentById: async (req, res, next) => {
      try {
        const payment = await paymentRepo.getById(req.params.id);
        if (!payment) {
          const err = new Error("Pago no encontrado");
          err.status = 404;
          throw err;
        }
        return res.json({ success: true, data: payment });
      } catch (error) {
        next(error);
      }
    },

    updatePayment: async (req, res, next) => {
      try {
        const { id } = req.params;
        const updateFields = { ...req.body, updatedAt: new Date() };

        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;
        delete updateFields.userId;
        delete updateFields.groupId; 

        const ok = await paymentRepo.update(id, updateFields);
        if (!ok) {
          const err = new Error("Pago no encontrado o no actualizado");
          err.status = 404;
          throw err;
        }

        const updated = await paymentRepo.getById(id);
        return res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    },

    deletePayment: async (req, res, next) => {
      try {
        const ok = await paymentRepo.delete(req.params.id);
        if (!ok) {
          const err = new Error("Pago no encontrado o no eliminado");
          err.status = 404;
          throw err;
        }
        return res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
};
