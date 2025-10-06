const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/GestorGastosGrupales'; 

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Conexión a MongoDB establecida...');
    } catch (error) {
        console.error('No se pudo conectar a MongoDB:', error.message);
        process.exit(1);
    }
}

async function closeDB() {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
}

module.exports = { connectDB, closeDB };