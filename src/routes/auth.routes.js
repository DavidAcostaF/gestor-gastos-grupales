const { Router } = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = function buildAuthRouter({ userRepo }) {
  if (!userRepo) throw new Error('userRepo es requerido en auth.routes');

  const router = Router();

  router.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        const err = new Error("email y password son obligatorios");
        err.status = 400;
        throw err;
      }

      const user = await userRepo.findByEmail(email);
      const valid = user ? await bcrypt.compare(password, user.password) : false;

      if (!valid) {
        const err = new Error("Credenciales inválidas");
        err.status = 401;
        throw err;
      }
      const token = jwt.sign({ sub: String(user._id) }, process.env.SECRET_KEY, { expiresIn: "1h" });

      const safeUser = { id: String(user._id), name: user.name, email: user.email, status: user.status };
      res.json({ success: true, token, user: safeUser });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
