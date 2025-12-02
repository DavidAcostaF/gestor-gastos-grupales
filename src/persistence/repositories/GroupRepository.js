import { ObjectId } from "mongodb";
import BaseRepository from "./BaseRepository.js";

class GroupRepository extends BaseRepository {
  constructor(db) {
    super("groups", db);
  }

  async create(groupObj) {
    const result = await this.getCollection().insertOne(groupObj);
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

  async addParticipant(groupId, userId, role = "member") {
    const _gid = typeof groupId === "string" ? new ObjectId(groupId) : groupId;
    const _uid = typeof userId === "string" ? new ObjectId(userId) : userId;
    const participant = { userId: _uid, role };
    const res = await this.getCollection().updateOne(
      { _id: _gid },
      { $push: { participants: participant }, $set: { updatedAt: new Date() } }
    );
    return res.modifiedCount > 0;
  }
}

export default GroupRepository;
