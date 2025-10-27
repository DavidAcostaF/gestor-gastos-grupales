import express, { json } from "express";
import { connectDB, closeDB } from "./persistence/db/connection.js";
import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import buildAuthRouter from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import verifyToken from "./middlewares/auth.middleware.js";
import UserRepository from "./persistence/repositories/UserRepository.js";
import PaymentRepository from "./persistence/repositories/PaymentRepository.js";

const app = express();
const db = await connectDB();

const userRepo = new UserRepository(db);
const paymentRepo = new PaymentRepository(db);

app.use(json());

// Ruta de autenticación
app.use("/api/v1/auth", buildAuthRouter({ userRepo }));

app.use("/api/v1/protected", protectedRoutes);

// Rutas de los demas CRUDs
// Inyección de dependencias mejor practica
import buildUsersRouter from "./routes/users.routes.js";
app.use("/api/v1/users", verifyToken, buildUsersRouter({ userRepo }));

// payments routes nad import
import buildPaymentsRouter from "./routes/payments.routes.js";
app.use("/api/v1/payments", verifyToken, buildPaymentsRouter({ paymentRepo }));

// Manejadores de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
