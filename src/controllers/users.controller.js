const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

module.exports = function buildUsersController({ userRepo }) {
  if (!userRepo) throw new Error("userRepo es requerido en users.controller");

  return {
    createUser: async (req, res, next) => {
      try {
        const { name, email, password, avatarUrl } = req.body;

        if (!name || !email || !password) {
          const err = new Error("name, email y password son obligatorios");
          err.status = 400;
          throw err;
        }

        const now = new Date();
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = {
          name,
          email,
          password: hashed,
          avatarUrl: avatarUrl || null,
          status: "active",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        const insertedId = await userRepo.create(newUser);
        const created = await userRepo.getById(insertedId);

        if (created?.password) delete created.password;

        return res.status(201).json({ success: true, data: created });
      } catch (error) {
        next(error);
      }
    },

    getUsers: async (req, res, next) => {
      try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const users = await userRepo.getAll(filter);
        return res.json({ success: true, data: users });
      } catch (error) {
        next(error);
      }
    },

    getUserById: async (req, res, next) => {
      try {
        const user = await userRepo.getById(req.params.id);
        if (!user) {
          const err = new Error("Usuario no encontrado");
          err.status = 404;
          throw err;
        }
        return res.json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    },

    updateUser: async (req, res, next) => {
      try {
        const { id } = req.params;
        const updateFields = { ...req.body, updatedAt: new Date() };

        delete updateFields._id;
        delete updateFields.createdAt;
        delete updateFields.deletedAt;

        if (updateFields.password) {
          updateFields.password = await bcrypt.hash(updateFields.password, 10); // ✅
        }

        const ok = await userRepo.update(id, updateFields);
        if (!ok) {
          const err = new Error("Usuario no encontrado o no actualizado");
          err.status = 404;
          throw err;
        }

        const updated = await userRepo.getById(id);
        if (updated?.password) delete updated.password;
        return res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    },

    deleteUser: async (req, res, next) => {
      try {
        const ok = await userRepo.delete(req.params.id);
        if (!ok) {
          const err = new Error("Usuario no encontrado o no eliminado");
          err.status = 404;
          throw err;
        }
        return res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
};
