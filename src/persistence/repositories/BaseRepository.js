class BaseRepository {
    constructor(collectionName, db) {
        this.collectionName = collectionName;
        this.db = db;
        this.collection = db.collection(collectionName);
    }

    getCollection() {
        if (!this.collection) {
            throw new Error("Repository not initialized.");
        }
        return this.collection;
    }
}

export default BaseRepository;