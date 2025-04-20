const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  process: { type: String },
  originalPrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  duration: { type: String, required: true },
  image: { type: String }, // <-- added image field
  subservices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subservice" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", ServiceSchema);
