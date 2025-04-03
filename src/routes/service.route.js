const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getService);

// Protected routes (require authentication and admin role)
router.use(verifyToken, isAdmin);
router.post("/", serviceController.createService);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router; 