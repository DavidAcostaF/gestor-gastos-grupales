const { ObjectId } = require("mongodb");
const BaseRepository = require("./BaseRepository");

class PaymentRepository extends BaseRepository {
  constructor(db) {
    super("payments", db);

  }

  async create(paymentObj) {

    // convertir strings a ObjectId si es necesario
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
    const _id = new ObjectId(id);
    return this.getCollection().findOne({ _id });
  }

  async getAll(filter = {}) {
    const queryFilter = { ...filter };

    if (queryFilter.groupId && typeof queryFilter.groupId === 'string') {
      queryFilter.groupId = new ObjectId(queryFilter.groupId);
    }
    if (queryFilter.userId && typeof queryFilter.userId === 'string') {
      queryFilter.userId = new ObjectId(queryFilter.userId);
    }
    if (queryFilter.approvedBy && typeof queryFilter.approvedBy === 'string') {
      queryFilter.approvedBy = new ObjectId(queryFilter.approvedBy);
    }

    return this.getCollection().find(queryFilter).toArray();
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
    const _id = new ObjectId(id);
    const result = await this.getCollection().deleteOne({ _id });
    return result.deletedCount > 0;
  }
}

module.exports = PaymentRepository;
