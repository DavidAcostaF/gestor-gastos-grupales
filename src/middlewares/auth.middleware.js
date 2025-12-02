import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado o inválido" });
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = { id: decoded.sub || decoded.userId };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
export default verifyToken;
