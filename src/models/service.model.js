const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }, // Short description
  process: { type: String }, // Process details (e.g., 6-step process)
  originalPrice: { type: Number, required: true }, // Price before discount
  discountedPrice: { type: Number, required: true }, // Price after discount
  duration: { type: String, required: true }, // Duration of service
  subservices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subservice" }], // Multiple subservices
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", ServiceSchema);
