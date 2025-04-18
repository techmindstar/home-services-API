const mongoose = require("mongoose");

const SubserviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true }, // Linked to a service
    description: { type: String }, // Short description
    process: { type: String }, // Process details
    originalPrice: { type: Number, required: true }, // Before discount
    discountedPrice: { type: Number, required: true }, // After discount
    duration: { type: String, required: true }, // Duration of subservice
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model("Subservice", SubserviceSchema);
  