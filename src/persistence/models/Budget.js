// models/Budget.js
class Budget {
  constructor({ 
    groupId, 
    category = "", // Nombre de la categoría (ej: "Alimentación", "Transporte")
    limit = 0, // Límite de gasto
    spent = 0, // Cantidad gastada (se actualiza con cada gasto)
    period = "monthly", // monthly | weekly | yearly
    startDate = null,
    endDate = null,
    totalAmount = 0, // Deprecated: usar limit
    categories = [] // Deprecated: usar category
  }) {
    const now = new Date();

    this.groupId = groupId;
    this.category = category;
    this.limit = limit || totalAmount; // Compatibilidad
    this.spent = spent;
    this.period = period;
    this.startDate = startDate;
    this.endDate = endDate;
    this.totalAmount = totalAmount; // Deprecated
    this.categories = categories; // Deprecated
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;
  }
}

module.exports = Budget;
