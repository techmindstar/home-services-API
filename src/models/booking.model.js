const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }], // Multiple services
  subservices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subservice" }], // Multiple subservices
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true }, // <--- reference here
  serviceProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceProvider" }, // Assigned service provider
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "completed", "cancelled"], 
    default: "pending" 
  },
  discount: { type: Number, default: 0 }, // Discount on total price
  finalPrice: { type: Number, required: true }, // Price after discount
  assignedAt: { type: Date }, // When service provider was assigned
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who assigned
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", BookingSchema);
