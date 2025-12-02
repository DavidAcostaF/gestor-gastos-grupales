import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "expense_app";

const SALT_ROUNDS = 10;

const adminUser = {
  name: "Administrador",
  email: "admin@gastosgrupo.com",
  password: "Admin123!", // Cambiar en producción
  role: "admin",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

async function seedAdmin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // Verificar si ya existe un admin
    const existingAdmin = await usersCollection.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log("El usuario administrador ya existe:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}`);
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(adminUser.password, SALT_ROUNDS);

    // Crear el usuario admin
    const result = await usersCollection.insertOne({
      ...adminUser,
      password: hashedPassword,
    });

    console.log("Usuario administrador creado exitosamente:");
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Contraseña: ${adminUser.password}`);
    console.log("");
    console.log("IMPORTANTE: Cambia la contraseña después del primer login");

  } catch (error) {
    console.error("Error al crear el administrador:", error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("Conexion cerrada");
  }
}

seedAdmin();
