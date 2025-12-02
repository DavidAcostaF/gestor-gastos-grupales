import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class PaymentRepository extends BaseRepository {
  constructor(db) {
    super("payments", db);
  }

  async create(paymentObj) {
    if (paymentObj.groupId && typeof paymentObj.groupId === "string")
      paymentObj.groupId = new ObjectId(paymentObj.groupId);
    if (paymentObj.userId && typeof paymentObj.userId === "string")
      paymentObj.userId = new ObjectId(paymentObj.userId);
    if (paymentObj.approvedBy && typeof paymentObj.approvedBy === "string")
      paymentObj.approvedBy = new ObjectId(paymentObj.approvedBy);

    const result = await this.getCollection().insertOne(paymentObj);
    return result.insertedId;
  }

  async getById(id) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.getCollection().findOne({ _id, deletedAt: null });
  }

  async getAll(filter = {}) {
    return this.getCollection()
      .find({ deletedAt: null, ...filter })
      .toArray();
  }

  async update(id, updateFields) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    updateFields.updatedAt = new Date();
    const res = await this.getCollection().updateOne(
      { _id },
      { $set: updateFields }
    );
    return res.modifiedCount > 0;
  }

  async delete(id) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const res = await this.getCollection().updateOne(
      { _id },
      { $set: { deletedAt: new Date() } }
    );
    return res.modifiedCount > 0;
  }
}

export default PaymentRepository;
