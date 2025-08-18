const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(verifyToken);

// User routes (for their own bookings)
router.get("/my-bookings", bookingController.getUserBookings);
router.get("/my-bookings/:id", bookingController.getUserBooking);
router.post("/", bookingController.createBooking);
router.put("/my-bookings/:id", bookingController.updateBooking);
router.delete("/my-bookings/:id", bookingController.deleteBooking);
router.patch(
  "/my-bookings/:id/reschedule",
  bookingController.rescheduleBooking
);
router.patch("/my-bookings/:id/cancel", bookingController.cancelBooking);

// Admin routes (for managing all bookings)
router.use(isAdmin);
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBooking);
router.get("/service/:serviceId", bookingController.getBookingsByService);
router.get(
  "/subservice/:subserviceId",
  bookingController.getBookingsBySubservice
);
router.put("/:bookingId/assign-provider", bookingController.assignServiceProvider);

module.exports = router;
