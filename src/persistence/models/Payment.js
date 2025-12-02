// models/Payment.js
class Payment {

  constructor({
    
    groupId,
    userId,
    amount,
    date = new Date(),
    method,
    reference = "",
    receiptUrl = "",
    note = "",
    status = "pending",
    approvedBy = null,
    approvedAt = null,
  }) {

    const now = new Date();

    this.groupId = groupId;
    this.userId = userId;
    this.amount = amount;
    this.date = date;
    this.method = method;
    this.reference = reference;
    this.receiptUrl = receiptUrl;
    this.note = note;
    this.status = status;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt;
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;

  }

}

module.exports = Payment;
