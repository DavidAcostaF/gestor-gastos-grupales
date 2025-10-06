// models/Expense.js
class Expense {
  constructor({ groupId, userId, categoryId = null, amount, date = new Date(), description = "", details = [], attachments = [], tags = [] }) {
    this.groupId = groupId;       
    this.userId = userId;         
    this.categoryId = categoryId; 
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.attachments = attachments;
    this.details = details; // array of { userId, amountAssigned, percent }
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
    this.tags = tags;
  }
}

module.exports = Expense;
