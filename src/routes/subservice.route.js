const express = require("express");
const router = express.Router();
const subserviceController = require("../controllers/subservice.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes
router.get("/", subserviceController.getAllSubservices);
router.get("/:id", subserviceController.getSubservice);
router.get("/service/:serviceId", subserviceController.getSubservicesByService);

// Protected routes (require authentication and admin role)
router.use(verifyToken, isAdmin);
router.post("/", subserviceController.createSubservice);
router.put("/:id", subserviceController.updateSubservice);
router.delete("/:id", subserviceController.deleteSubservice);

module.exports = router; 