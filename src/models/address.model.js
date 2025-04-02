const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  houseNo: { type: String }, // House/Flat Number
  street: { type: String, required: true },
  fullAddress: { type: String }, // Complete Address
  landmark: { type: String }, // Nearby Landmark
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Address", AddressSchema);
