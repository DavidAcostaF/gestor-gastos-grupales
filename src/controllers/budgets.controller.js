export default function buildBudgetsController({ budgetRepo }) {
  if (!budgetRepo) {
    throw new Error("budgetRepo es requerido en budgets.controller");
  }

  const createBudget = async (req, res, next) => {
    try {
      const { groupId, category, limit, period, startDate, endDate } = req.body;

      if (!groupId || !category || !limit) {
        return res.status(400).json({
          success: false,
          message: "Grupo, categoría y límite son requeridos"
        });
      }

      const budgetData = {
        groupId,
        category,
        limit: parseFloat(limit),
        period: period || 'monthly',
        spent: 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const budgetId = await budgetRepo.create(budgetData);
      
      res.status(201).json({
        success: true,
        message: "Presupuesto creado exitosamente",
        data: { _id: budgetId, ...budgetData }
      });
    } catch (error) {
      next(error);
    }
  };

  const getBudgets = async (req, res, next) => {
    try {
      const { groupId } = req.query;
      const filter = groupId ? { groupId } : {};
      const budgets = await budgetRepo.getAll(filter);
      
      res.json({
        success: true,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
  };

  const getBudgetById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const budget = await budgetRepo.getById(id);
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
      }

      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  };

  const updateBudget = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.limit) {
        updateData.limit = parseFloat(updateData.limit);
      }
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const updated = await budgetRepo.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
      }

      const budget = await budgetRepo.getById(id);
      res.json({
        success: true,
        message: "Presupuesto actualizado",
        data: budget
      });
    } catch (error) {
      next(error);
    }
  };

  const deleteBudget = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await budgetRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
      }

      res.json({
        success: true,
        message: "Presupuesto eliminado"
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createBudget,
    getBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget
  };
}
