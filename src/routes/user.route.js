const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");

// All routes require authentication
router.use(authenticate.verifyToken);

// User routes
router.get("/profile", userController.getUser);
router.put("/profile", userController.updateUser);

module.exports = router;
