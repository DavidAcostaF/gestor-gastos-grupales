// Middleware para rutas no encontradas (404)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `La ruta ${req.originalUrl} no existe en este servidor`,
  });
};

export default notFoundHandler;
