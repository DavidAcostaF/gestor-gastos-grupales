import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });


import express, { json } from 'express';
import { connectDB, closeDB } from "./persistence/db/connection.js";
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';


import buildAuthRouter from "./routes/auth.routes.js";
import buildGroupsRouter from "./routes/groups.routes.js";


import protectedRoutes from "./routes/protected.routes.js";
import verifyToken from './middlewares/auth.middleware.js';
import UserRepository from './persistence/repositories/UserRepository.js';
import GroupRepository from './persistence/repositories/GroupRepository.js';
const app = express();
const db = await connectDB();


const userRepo = new UserRepository(db);
const groupRepo = new GroupRepository(db);

app.use(json());


// Ruta de autenticación
app.use('/api/v1/auth', buildAuthRouter({ userRepo }));

app.use('/api/v1/protected', protectedRoutes)

// Manejadores de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Rutas de los demas CRUDs
// Inyección de dependencias mejor practica
import buildUsersRouter from './routes/users.routes.js';
app.use('/api/v1/users', buildUsersRouter({ userRepo, verifyToken }));

// A partir de aquí, todas requieren token
app.use(verifyToken)

app.use('/api/v1/groups', buildGroupsRouter({ groupRepo }));



const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
