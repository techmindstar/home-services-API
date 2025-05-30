const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Remove any non-digit characters and check length
        const cleaned = String(v).replace(/\D/g, '');
        return cleaned.length === 10;
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    set: function(v) {
      // Convert to string and remove any non-digit characters
      return String(v).replace(/\D/g, '');
    }
  },
  name: { type: String },
  email: { type: String, sparse: true },
  password: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ["client", "admin"], default: "client" },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
