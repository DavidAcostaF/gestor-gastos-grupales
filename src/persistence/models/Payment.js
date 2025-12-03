// models/Payment.js
class Payment {

  constructor({
    groupId,
    fromUserId, // Quien paga la deuda
    toUserId, // A quien se le paga
    amount,
    date = new Date(),
    method = "",
    reference = "",
    receiptUrl = "",
    note = "",
    status = "pending", // pending | completed | cancelled
    approvedBy = null,
    approvedAt = null,
    expenseId = null, // Opcional: gasto relacionado
  }) {

    const now = new Date();

    this.groupId = groupId;
    this.fromUserId = fromUserId; // Deudor que paga
    this.toUserId = toUserId; // Acreedor que recibe
    this.amount = amount;
    this.date = date;
    this.method = method;
    this.reference = reference;
    this.receiptUrl = receiptUrl;
    this.note = note;
    this.status = status;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt;
    this.expenseId = expenseId;
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;

  }

}

module.exports = Payment;
