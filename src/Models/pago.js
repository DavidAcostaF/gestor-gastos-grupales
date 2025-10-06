const mongoose = require("mongoose");

const PagoSchema = new mongoose.Schema(
  {
    grupo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grupo",
    },
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    monto: {
      type: mongoose.Schema.Types.Decimal128,
    },
    fecha: {
      type: Date,
    },
    metodo: {
      type: String,
    },
    referencia: {
      type: String,
    },
    comprobante_url: {
      type: String,
    },
    nota: {
      type: String,
    },
    estatus: {
      type: String,
    },
    aprobado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    aprobado_en: {
      type: Date,
    },
    created_at: {
      type: Date,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "Pago",
  }
);

const PagoModel = mongoose.model("Pago", PagoSchema);

module.exports = { PagoModel };
