import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "expense_app";

console.log("MongoDB URI:", uri);
console.log("Database Name:", dbName);

let client = null;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    console.log("Connected to MongoDB");
  }
  return client.db(dbName);
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    console.log("MongoDB connection closed");
  }
}

process.on("SIGINT", async () => {
  await closeDB();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await closeDB();
  process.exit(0);
});

export { connectDB, closeDB };
