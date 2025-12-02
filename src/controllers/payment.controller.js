export default function buildPaymentsController({ paymentRepo }) {
  if (!paymentRepo) {
    throw new Error("paymentRepo es requerido en payments.controller");
  }

  return {
    /**
     * @route POST /api/v1/payments
     * @desc Crea un nuevo pago entre dos usuarios de un grupo
     */
    createPayment: async (req, res, next) => {
      try {
        const {
          groupId,
          fromUserId,
          toUserId,
          amount,
          status,
          date,
          notes,
          // Campos legacy para compatibilidad
          userId,
          method,
          reference,
          receiptUrl,
          note,
        } = req.body || {};

        // Validación flexible: acepta formato nuevo (fromUserId/toUserId) o legacy (userId/method)
        const finalFromUserId = fromUserId || userId;
        const finalToUserId = toUserId;

        // Validar campos obligatorios
        const errors = [];
        if (!groupId) errors.push("groupId es obligatorio");
        if (!finalFromUserId)
          errors.push("fromUserId (pagador) es obligatorio");
        if (!amount || amount <= 0) errors.push("amount debe ser mayor a 0");

        if (errors.length > 0) {
          return res.status(400).json({
            success: false,
            message: errors.join(", "),
            errors,
          });
        }

        // Validar que pagador y receptor sean diferentes (si hay receptor)
        if (finalToUserId && finalFromUserId === finalToUserId) {
          return res.status(400).json({
            success: false,
            message: "El pagador y receptor deben ser diferentes",
          });
        }

        const now = new Date();
        const doc = {
          groupId,
          fromUserId: finalFromUserId,
          toUserId: finalToUserId || null,
          // Campos legacy
          userId: finalFromUserId,
          method: method || "transfer",
          amount: parseFloat(amount),
          date: date ? new Date(date) : now,
          reference: reference || "",
          receiptUrl: receiptUrl || "",
          notes: notes || note || "",
          status: status || "pending",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const id = await paymentRepo.create(doc);
        const created = await paymentRepo.getById(id);

        return res.status(201).json({
          success: true,
          message: "Pago registrado exitosamente",
          data: created,
        });
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

        // No permitir cambiar estos campos
        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;

        // Convertir amount a número si existe
        if (updateFields.amount) {
          updateFields.amount = parseFloat(updateFields.amount);
        }

        // Convertir fecha si existe
        if (updateFields.date) {
          updateFields.date = new Date(updateFields.date);
        }

        const ok = await paymentRepo.update(req.params.id, updateFields);
        if (!ok) {
          return res.status(404).json({
            success: false,
            message: "Pago no encontrado",
          });
        }
        const updated = await paymentRepo.getById(req.params.id);
        res.json({
          success: true,
          message: "Pago actualizado",
          data: updated,
        });
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
          return res.status(404).json({
            success: false,
            message: "Pago no encontrado",
          });
        }
        res.json({
          success: true,
          message: "Pago eliminado",
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
