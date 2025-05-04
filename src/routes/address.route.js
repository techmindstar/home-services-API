const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller.js");
const authenticate = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate.verifyToken);

// Address routes
router.post("/", addressController.createAddress);
router.get("/", addressController.getAllAddresses);
router.get("/:addressId", addressController.getAddress);
router.get("/admin/:addressId", addressController.getAddressForAdmin);
router.put("/:addressId", addressController.updateAddress);
router.delete("/:addressId", addressController.deleteAddress);

module.exports = router;
