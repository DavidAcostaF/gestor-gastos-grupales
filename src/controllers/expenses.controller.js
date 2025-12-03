export default function buildExpensesController({ expenseRepo, budgetRepo }) {
  if (!expenseRepo) throw new Error("expenseRepo es requerido en expenses.controller");

  return {
    createExpense: async (req, res, next) => {
      try {
        const {
          groupId,
          userId,
          budgetId,
          categoryId,
          amount,
          date,
          description,
          details,
          attachments,
          tags,
          splitType,
          splitDetails,
        } = req.body || {};

        // Validaciones básicas
        if (!groupId || !userId || !amount) {
          const err = new Error("groupId, userId y amount son obligatorios");
          err.status = 400;
          throw err;
        }

        if (details && !Array.isArray(details)) {
          const err = new Error("details debe ser un arreglo");
          err.status = 400;
          throw err;
        }
        if (attachments && !Array.isArray(attachments)) {
          const err = new Error("attachments debe ser un arreglo");
          err.status = 400;
          throw err;
        }
        if (tags && !Array.isArray(tags)) {
          const err = new Error("tags debe ser un arreglo");
          err.status = 400;
          throw err;
        }

        const now = new Date();
        const doc = {
          groupId,
          userId,
          budgetId: budgetId || null,
          categoryId: categoryId || null,
          amount,
          date: date ? new Date(date) : now,
          description: description || "",
          details: details || [],
          attachments: attachments || [],
          tags: tags || [],
          splitType: splitType || "equal",
          splitDetails: splitDetails || [],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const id = await expenseRepo.create(doc);
        const created = await expenseRepo.getById(id);

        // Actualizar el presupuesto si hay uno asociado
        if (budgetId && budgetRepo) {
          try {
            const budget = await budgetRepo.getById(budgetId);
            if (budget) {
              const newSpent = (budget.spent || 0) + amount;
              await budgetRepo.update(budgetId, { spent: newSpent, updatedAt: now });
            }
          } catch (e) {
            console.error("Error actualizando presupuesto:", e);
          }
        }

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    },

    getExpenses: async (req, res, next) => {
      try {
        const filter = {};
        if (req.query.groupId) filter.groupId = req.query.groupId;
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.tag) filter.tags = req.query.tag;

        const expenses = await expenseRepo.getAll(filter);
        res.json({ success: true, data: expenses });
      } catch (error) {
        next(error);
      }
    },

    getExpenseById: async (req, res, next) => {
      try {
        const expense = await expenseRepo.getById(req.params.id);
        if (!expense) {
          const err = new Error("Gasto no encontrado");
          err.status = 404;
          throw err;
        }
        res.json({ success: true, data: expense });
      } catch (error) {
        next(error);
      }
    },

    updateExpense: async (req, res, next) => {
      try {
        const updateFields = { ...req.body, updatedAt: new Date() };
        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;

        const ok = await expenseRepo.update(req.params.id, updateFields);
        if (!ok) {
          const err = new Error("Gasto no encontrado o no actualizado");
          err.status = 404;
          throw err;
        }
        const updated = await expenseRepo.getById(req.params.id);
        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    },

    deleteExpense: async (req, res, next) => {
      try {
        const ok = await expenseRepo.delete(req.params.id);
        if (!ok) {
          const err = new Error("Gasto no encontrado o no eliminado");
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
