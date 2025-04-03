const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller.js");

router.post("/user/send-otp", authController.generateAndSendOtp);
router.post("/user/verify-otp", authController.verifyOtp);

module.exports = router;
