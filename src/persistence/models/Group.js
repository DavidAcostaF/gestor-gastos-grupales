class Group {
  constructor({ name, description }) {
    const now = new Date();
    this.name = name;
    this.description = description || "";
    this.dateCreated = now;
    this.createdAt = now;
    this.updatedAt = now;
    this.deletedAt = null;
    this.participants = []; // array of { userId: ObjectId, role: String }
    this.categories = []; 
    this.tags = [];
  }
}

module.exports = Group;
