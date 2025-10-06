// models/Budget.js
class Budget {
  constructor({ groupId, period, totalAmount, categories = [] }) {
    const now = new Date();

    this.groupId = groupId;        
    this.period = period;            
    this.totalAmount = totalAmount;  
    this.categories = categories;    // array { categoryId, limitAmount }
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;
  }
}

module.exports = Budget;
