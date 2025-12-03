// models/Expense.js
class Expense {
  constructor({ 
    groupId, 
    userId, // Usuario que registró/pagó el gasto
    budgetId = null, // Presupuesto al que pertenece este gasto
    categoryId = null, 
    amount, 
    date = new Date(), 
    description = "", 
    details = [], 
    attachments = [], 
    tags = [],
    splitType = "equal", // "equal" | "percentage" | "amount" | "shares"
    splitDetails = [] // array of { userId, amount, percentage, shares, paid }
  }) {
    this.groupId = groupId;       
    this.userId = userId; // Quien pagó originalmente
    this.budgetId = budgetId; // Relación con presupuesto
    this.categoryId = categoryId; 
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.attachments = attachments;
    this.details = details; // array of { userId, amountAssigned, percent }
    this.splitType = splitType;
    this.splitDetails = splitDetails; // Detalle del reparto entre miembros
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
    this.tags = tags;
  }
}

module.exports = Expense;
