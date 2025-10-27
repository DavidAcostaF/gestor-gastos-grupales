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
import buildExpensesRouter from './routes/expenses.routes.js';
import buildBudgetsRouter from './routes/budget.routes.js';
import buildUsersRouter from './routes/users.routes.js';


import protectedRoutes from "./routes/protected.routes.js";
import verifyToken from './middlewares/auth.middleware.js';
import UserRepository from './persistence/repositories/UserRepository.js';
import GroupRepository from './persistence/repositories/GroupRepository.js';
import ExpenseRepository from './persistence/repositories/ExpenseRepository.js';
import BudgetRepository from './persistence/repositories/BudgetRepository.js';
const app = express();
const db = await connectDB();


const userRepo = new UserRepository(db);
const groupRepo = new GroupRepository(db);
const expenseRepo = new ExpenseRepository(db);
const budgetRepo = new BudgetRepository(db);

app.use(json());


// Ruta de autenticación
app.use('/api/v1/auth', buildAuthRouter({ userRepo }));

app.use('/api/v1/protected', protectedRoutes)



// Rutas de los demas CRUDs
// Inyección de dependencias mejor practica
app.use('/api/v1/users', buildUsersRouter({ userRepo, verifyToken }));
app.use('/api/v1/expenses',verifyToken, buildExpensesRouter({ expenseRepo }));
app.use('/api/v1/groups',verifyToken, buildGroupsRouter({ groupRepo }));
app.use('/api/v1/budgets', buildBudgetsRouter({ budgetRepo, verifyToken }));

// Manejadores de errores
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});