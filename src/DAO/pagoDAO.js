const { PagoModel } = require('./pago');

class PagoDAO {

    async registrar(pagoData) {
        const nuevoPago = new PagoModel(pagoData);
        return await nuevoPago.save();
    }

    async obtenerTodos() {
        return await PagoModel.find({});
    }

    async obtenerPorId(id) {
        return await PagoModel.findById(id);
    }

    async actualizar(id, datosActualizados) {
        return await PagoModel.findByIdAndUpdate(id, datosActualizados, { new: true });
    }

    async borrar(id) {
        return await PagoModel.findByIdAndDelete(id);
    }
}

module.exports = { PagoDAO };