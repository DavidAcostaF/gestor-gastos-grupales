const { ObjectId } = require("mongodb");
const BaseRepository  = require("./BaseRepository");

class UserRepository extends BaseRepository {
  constructor(db) {
    super("users", db);

  }

  async create(userObj) {
    const result = await this.getCollection().insertOne(userObj);
    return result.insertedId;
  }

  async getById(id) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return await this.getCollection().findOne({ _id, deletedAt: null });
  }

  async getAll(filter = {}) {
    const base = { deletedAt: null, ...filter };
    return await this.getCollection().find(base).toArray();
  }

  async update(id, updateFields) {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    updateFields.updatedAt = new Date();
    const res = await this.getCollection().updateOne({ _id }, { $set: updateFields });
    return res.modifiedCount > 0;
  }

  async delete(id) {
    // soft delete
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const res = await this.getCollection().updateOne({ _id }, { $set: { deletedAt: new Date() } });
    return res.modifiedCount > 0;
  }
}

module.exports = UserRepository;
