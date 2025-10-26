const users = require('../data/users.data');

exports.getUsers = (req, res) => {
  res.json({
    success: true,
    data: users,
  });
};

exports.getUserById = (req, res, next) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    return next(error);
  }
  res.json({ success: true, data: user });
};

exports.createUser = (req, res, next) => {
  try {
    const newUser = {
      id: `u-${Date.now()}`,
      name: req.body.name,
      email: req.body.email,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = (req, res, next) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    return next(error);
  }
  users[index] = { ...users[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: users[index] });
};

exports.deleteUser = (req, res, next) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    return next(error);
  }
  users.splice(index, 1);
  res.status(204).send();
};
