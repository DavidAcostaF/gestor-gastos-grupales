import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class ExpenseRepository extends BaseRepository{
  constructor(db) {
    super("expenses", db);
  }

  async create(expenseObj) {

    // Convert possible string ids to ObjectId
    if (expenseObj.groupId && typeof expenseObj.groupId === "string") expenseObj.groupId = new ObjectId(expenseObj.groupId);
    if (expenseObj.userId && typeof expenseObj.userId === "string") expenseObj.userId = new ObjectId(expenseObj.userId);
    if (expenseObj.categoryId && typeof expenseObj.categoryId === "string") expenseObj.categoryId = new ObjectId(expenseObj.categoryId);

    const result = await this.getCollection().insertOne(expenseObj);
    return result.insertedId;
  }

  async getById(id) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return this.getCollection().findOne({ _id, deletedAt: null });
  }

  async getAll(filter = {}) {
    return this.getCollection().find({ deletedAt: null, ...filter }).toArray();
  }

  async update(id, updateFields) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    updateFields.updatedAt = new Date();
    const res = await this.getCollection().updateOne({ _id }, { $set: updateFields });
    return res.modifiedCount > 0;
  }

  async delete(id) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const res = await this.getCollection().updateOne({ _id }, { $set: { deletedAt: new Date() } });
    return res.modifiedCount > 0;
  }
}

export default ExpenseRepository;
