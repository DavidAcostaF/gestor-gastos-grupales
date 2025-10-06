// test/testDAL.js
const { ObjectId } = require("mongodb");
const { connectDB } = require("../../src/persistence/db/connection");

// ===== Models =====
const User = require("../../src/persistence/models/User");
const Group = require("../../src/persistence/models/Group");
const Expense = require("../../src/persistence/models/Expense");
const Payment = require("../../src/persistence/models/Payment");
const Budget = require("../../src/persistence/models/Budget");

// ===== Repositories =====
const UserRepository = require("../../src/persistence/repositories/UserRepository");
const GroupRepository = require("../../src/persistence/repositories/GroupRepository");
const ExpenseRepository = require("../../src/persistence/repositories/ExpenseRepository");
const PaymentRepository = require("../../src/persistence/repositories/PaymentRepository");
const BudgetRepository = require("../../src/persistence/repositories/BudgetRepository");

// ===== DB connection =====
const { closeDB } = require("../../src/persistence/db/connection");

(async () => {
  const db = await connectDB();
  const userRepo = new UserRepository(db);
  const groupRepo = new GroupRepository(db);
  const expenseRepo = new ExpenseRepository(db);
  const paymentRepo = new PaymentRepository(db);
  const budgetRepo = new BudgetRepository(db);

  try {
    console.log(" === TESTING DATA ACCESS LAYER (DAL) ===");

    // --- USERS ---
    console.log("\n Creating users...");
    const u1 = new User({ name: "Alice", email: "alice@example.com", password: "pass123" });
    const u2 = new User({ name: "Bob", email: "bob@example.com", password: "pass456" });

    const id1 = await userRepo.create(u1);
    const id2 = await userRepo.create(u2);
    console.log("Users created:", id1.toString(), id2.toString());

    console.log("\n All users:");
    console.log(await userRepo.getAll());

    // --- GROUPS ---
    console.log("\n Creating group...");
    const grp = new Group({ name: "Trip 2025", description: "Group for the summer trip" });
    const groupId = await groupRepo.create(grp);
    console.log(" Group created:", groupId.toString());

    console.log("\n Adding participants...");
    await groupRepo.addParticipant(groupId, id1, "owner");
    await groupRepo.addParticipant(groupId, id2, "member");

    const groupData = await groupRepo.getById(groupId);
    console.log("Group with participants:");
    console.dir(groupData, { depth: null });

    // --- EXPENSES ---
    console.log("\n Creating expense...");
    const expense = new Expense({
      groupId,
      userId: id1,
      amount: 1200.5,
      description: "Hotel booking",
      details: [
        { userId: id1, amountAssigned: 600.25, percentAssigned: 50 },
        { userId: id2, amountAssigned: 600.25, percentAssigned: 50 }
      ]
    });

    const expenseId = await expenseRepo.create(expense);
    console.log(" Expense created:", expenseId.toString());

    console.log("\n Expenses for group:");
    console.log(await expenseRepo.getAll({ groupId }));

    // --- PAYMENTS ---
    console.log("\n Creating payment...");
    const payment = new Payment({
      groupId,
      userId: id1,
      amount: 500.75,
      method: "transfer",
      reference: "PAY-REF-001",
      note: "Partial payment",
    });

    const paymentId = await paymentRepo.create(payment);
    console.log("Payment created:", paymentId.toString());

    console.log("\n Payments list:");
    console.log(await paymentRepo.getAll());

    // --- BUDGETS ---
    console.log("\n Creating budget...");
    const budget = new Budget({
      groupId,
      period: "2025-10",
      totalAmount: 5000,
      categories: [
        { categoryId: new ObjectId(), limitAmount: 1500 },
        { categoryId: new ObjectId(), limitAmount: 3500 },
      ],
    });

    const budgetId = await budgetRepo.create(budget);
    console.log("Budget created:", budgetId.toString());

    console.log("\n Budgets list:");
    console.log(await budgetRepo.getAll());

    // --- UPDATES ---
    console.log("\n Updating user name...");
    await userRepo.update(id1, { name: "Alice Updated" });
    console.log("Updated user:", await userRepo.getById(id1));

    console.log("\n Updating budget total...");
    await budgetRepo.update(budgetId, { totalAmount: 6000 });
    console.log("Updated budget:", await budgetRepo.getById(budgetId));

    // --- DELETES ---
    console.log("\n Deleting user2 (soft delete)...");
    await userRepo.delete(id2);
    console.log("Remaining users:", await userRepo.getAll());

    console.log("\n Deleting expense (soft delete)...");
    await expenseRepo.delete(expenseId);
    console.log("Remaining expenses:", await expenseRepo.getAll({ groupId }));

    console.log("\n All CRUD operations executed successfully!");

  } catch (err) {
    console.error("Error during DAL test:", err);
  } finally {
    await closeDB();
  }
})();
