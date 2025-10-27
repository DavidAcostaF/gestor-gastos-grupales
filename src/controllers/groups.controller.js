export default function buildGroupsController({ groupRepo }) {
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
        const doc = {
          name,
          description: description || null,
          participants: participants || [],
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
  };
}
