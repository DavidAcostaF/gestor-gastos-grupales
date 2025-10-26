const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/users.routes');
app.use('/api/v1/users', userRoutes);

const notFoundHandler = require('./middlewares/notFoundHandler');
app.use(notFoundHandler);

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
