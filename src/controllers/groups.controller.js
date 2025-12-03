import { ObjectId } from "mongodb";

export default function buildGroupsController({ groupRepo, expenseRepo, paymentRepo, userRepo }) {
  if (!groupRepo) throw new Error("groupRepo es requerido en groups.controller");

  return {
    createGroup: async (req, res, next) => {
      try {
        const { name, description, participants, categories, tags } = req.body || {};

        if (!name) {
          const err = new Error("name es obligatorio");
          err.status = 400;
          throw err;
        }

        if (participants && !Array.isArray(participants)) {
          const err = new Error("participants debe ser un arreglo");
          err.status = 400;
          throw err;
        }
        if (categories && !Array.isArray(categories)) {
          const err = new Error("categories debe ser un arreglo");
          err.status = 400;
          throw err;
        }
        if (tags && !Array.isArray(tags)) {
          const err = new Error("tags debe ser un arreglo");
          err.status = 400;
          throw err;
        }

        const now = new Date();
        
        // Convertir userId de los participantes a ObjectId
        const processedParticipants = (participants || []).map(p => ({
          userId: typeof p.userId === 'string' ? new ObjectId(p.userId) : p.userId,
          role: p.role || 'member'
        }));
        
        const doc = {
          name,
          description: description || null,
          participants: processedParticipants,
          categories: categories || [],
          tags: tags || [],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const id = await groupRepo.create(doc);
        const created = await groupRepo.getById(id);

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    },

    getGroups: async (req, res, next) => {
      try {
        const filter = {};
        if (req.query.tag) filter.tags = req.query.tag;
        const groups = await groupRepo.getAll(filter);
        res.json({ success: true, data: groups });
      } catch (error) {
        next(error);
      }
    },

    getGroupById: async (req, res, next) => {
      try {
        const group = await groupRepo.getById(req.params.id);
        if (!group) {
          const err = new Error("Grupo no encontrado");
          err.status = 404;
          throw err;
        }
        res.json({ success: true, data: group });
      } catch (error) {
        next(error);
      }
    },

    updateGroup: async (req, res, next) => {
      try {
        const updateFields = { ...req.body, updatedAt: new Date() };
        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;

        // Convertir userId de los participantes a ObjectId si existen
        if (updateFields.participants && Array.isArray(updateFields.participants)) {
          updateFields.participants = updateFields.participants.map(p => ({
            userId: typeof p.userId === 'string' ? new ObjectId(p.userId) : p.userId,
            role: p.role || 'member'
          }));
        }

        const ok = await groupRepo.update(req.params.id, updateFields);
        if (!ok) {
          const err = new Error("Grupo no encontrado o no actualizado");
          err.status = 404;
          throw err;
        }
        const updated = await groupRepo.getById(req.params.id);
        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    },

    deleteGroup: async (req, res, next) => {
      try {
        const ok = await groupRepo.delete(req.params.id);
        if (!ok) {
          const err = new Error("Grupo no encontrado o no eliminado");
          err.status = 404;
          throw err;
        }
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    addParticipant: async (req, res, next) => {
      try {
        const { id } = req.params;
        const { userId, role } = req.body;

        if (!userId) {
          const err = new Error("userId es obligatorio");
          err.status = 400;
          throw err;
        }

        const group = await groupRepo.getById(id);
        if (!group) {
          const err = new Error("Grupo no encontrado");
          err.status = 404;
          throw err;
        }

        const existingParticipant = (group.participants || []).find(
          p => p.userId?.toString() === userId
        );
        if (existingParticipant) {
          const err = new Error("El usuario ya es participante del grupo");
          err.status = 400;
          throw err;
        }

        const ok = await groupRepo.addParticipant(id, userId, role || "member");
        if (!ok) {
          const err = new Error("No se pudo agregar el participante");
          err.status = 500;
          throw err;
        }

        const updated = await groupRepo.getById(id);
        res.json({ success: true, message: "Participante agregado", data: updated });
      } catch (error) {
        next(error);
      }
    },

    removeParticipant: async (req, res, next) => {
      try {
        const { id, userId } = req.params;

        const group = await groupRepo.getById(id);
        if (!group) {
          const err = new Error("Grupo no encontrado");
          err.status = 404;
          throw err;
        }

        const participants = (group.participants || []).filter(
          p => p.userId?.toString() !== userId
        );

        const ok = await groupRepo.update(id, { participants });
        if (!ok) {
          const err = new Error("No se pudo eliminar el participante");
          err.status = 500;
          throw err;
        }

        const updated = await groupRepo.getById(id);
        res.json({ success: true, message: "Participante eliminado", data: updated });
      } catch (error) {
        next(error);
      }
    },

    calculateBalances: async (req, res, next) => {
      try {
        const { id } = req.params;

        const group = await groupRepo.getById(id);
        if (!group) {
          const err = new Error("Grupo no encontrado");
          err.status = 404;
          throw err;
        }

        const { ObjectId } = await import("mongodb");
        const groupIdObj = new ObjectId(id);
        const expenses = expenseRepo ? await expenseRepo.getAll({ groupId: groupIdObj }) : [];
        const payments = paymentRepo ? await paymentRepo.getAll({ groupId: groupIdObj }) : [];

        const balanceMap = {};

        const participants = group.participants || [];
        for (const p of participants) {
          const usrId = p.userId?.toString();
          if (usrId) {
            balanceMap[usrId] = { userId: usrId, paid: 0, owes: 0 };
          }
        }

        for (const expense of expenses) {
          const payerId = expense.userId?.toString();
          const amount = expense.amount || 0;

          if (payerId && balanceMap[payerId] !== undefined) {
            balanceMap[payerId].paid += amount;
          }

          if (expense.details && expense.details.length > 0) {
            for (const detail of expense.details) {
              const userId = detail.userId?.toString();
              if (userId && balanceMap[userId] !== undefined) {
                balanceMap[userId].owes += detail.amountAssigned || 0;
              }
            }
          } else {
            const perPerson = amount / (participants.length || 1);
            for (const p of participants) {
              const userId = p.userId?.toString();
              if (userId && userId !== payerId) {
                balanceMap[userId].owes += perPerson;
              }
            }
          }
        }

        for (const payment of payments) {
          const fromId = payment.userId?.toString();
          const toId = payment.toUserId?.toString();
          const amount = payment.amount || 0;

          if (fromId && balanceMap[fromId]) {
            balanceMap[fromId].paid += amount;
          }
          if (toId && balanceMap[toId]) {
            balanceMap[toId].owes -= amount;
          }
        }

        const balances = [];
        for (const [userId, data] of Object.entries(balanceMap)) {
          balances.push({
            userId,
            paid: data.paid,
            owes: data.owes,
            balance: data.paid - data.owes,
          });
        }

        const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b }));
        const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));

        const settlements = [];

        debtors.sort((a, b) => a.balance - b.balance);
        creditors.sort((a, b) => b.balance - a.balance);

        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
          const debtor = debtors[i];
          const creditor = creditors[j];

          const debtAmount = Math.abs(debtor.balance);
          const creditAmount = creditor.balance;
          const settleAmount = Math.min(debtAmount, creditAmount);

          if (settleAmount > 0.01) {
            settlements.push({
              from: debtor.userId,
              to: creditor.userId,
              amount: settleAmount,
            });
          }

          debtor.balance += settleAmount;
          creditor.balance -= settleAmount;

          if (Math.abs(debtor.balance) < 0.01) i++;
          if (Math.abs(creditor.balance) < 0.01) j++;
        }

        let usersInfo = {};
        if (userRepo) {
          const allUsers = await userRepo.getAll();
          for (const user of allUsers) {
            usersInfo[user._id.toString()] = {
              name: user.name,
              email: user.email,
            };
          }
        }

        res.json({
          success: true,
          data: {
            groupId: id,
            groupName: group.name,
            totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
            totalPayments: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
            balances,
            settlements,
            usersInfo,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
