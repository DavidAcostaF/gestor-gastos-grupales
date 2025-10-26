const { Router } = require('express');
const buildUsersController = require('../controllers/users.controller');

module.exports = function buildUsersRouter({ userRepo }) {
  if (!userRepo) throw new Error('userRepo es requerido en users.routes');

  const router = Router();
  const controller = buildUsersController({ userRepo });

  router.post('/', controller.createUser);
  router.get('/', controller.getUsers);
  router.get('/:id', controller.getUserById);
  router.patch('/:id', controller.updateUser);
  router.delete('/:id', controller.deleteUser);

  return router;
};
