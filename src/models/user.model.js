const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, sparse: true },
  password: { type: String, required: true }, // <-- Added password here
  avatar: { type: String },
  role: { type: String, enum: ["client", "admin"], default: "client" },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
