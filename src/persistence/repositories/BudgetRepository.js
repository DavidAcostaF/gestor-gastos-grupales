// repositories/BudgetRepository.js
import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class BudgetRepository extends BaseRepository {
  constructor(db) {
    super("budgets", db);
  }

  async create(budgetObj) {

    if (budgetObj.groupId && typeof budgetObj.groupId === "string")
      budgetObj.groupId = new ObjectId(budgetObj.groupId);

    // convertir categoryIds a ObjectId si son strings
    budgetObj.categories = (budgetObj.categories || []).map(cat => ({
      categoryId: typeof cat.categoryId === "string" ? new ObjectId(cat.categoryId) : cat.categoryId,
      limitAmount: cat.limitAmount
    }));

    const result = await this.getCollection().insertOne(budgetObj);
    return result.insertedId;
  }

  async getById(id) {
    const _id = new ObjectId(id);
    return this.getCollection().findOne({ _id, deletedAt: null });
  }

  async getAll(filter = {}) {
    return this.getCollection().find({ deletedAt: null, ...filter }).toArray();
  }

  async update(id, updateFields) {
    const _id = new ObjectId(id);
    updateFields.updatedAt = new Date();
    const result = await this.getCollection().updateOne(
      { _id },
      { $set: updateFields }
    );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    // SOFT DELETE
    const _id = new ObjectId(id);
    const result = await this.getCollection().updateOne(
      { _id },
      { $set: { deletedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }
}

export default BudgetRepository;
