const express = require("express");
const router = express.Router();
const wrapAsync = require("../utilis/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");
const { generateOTP } = require("../utils/otpUtil");
const { sendVerificationEmail } = require("../config/nodemailer");

// Signup routes
router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

// Verify OTP routes
router.route("/verify-otp")
    .get(wrapAsync(async (req, res) => {
        if (!req.session.tempUser) {
            req.flash("error", "Session expired. Please signup again.");
            return res.redirect("/signup");
        }
        res.render("users/verify-otp", { email: req.session.tempUser.email });
    }))
    .post(wrapAsync(userController.verifyOTP));

// Resend OTP route
router.post("/resend-otp", wrapAsync(async (req, res) => {
    try {
        const tempUser = req.session.tempUser;
        if (!tempUser) {
            return res.status(400).json({ error: "Session expired" });
        }

        const newOtp = generateOTP();
        tempUser.otp = {
            code: newOtp,
            generatedAt: new Date()
        };
        
        await sendVerificationEmail(tempUser.email, newOtp);
        res.json({ success: true });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ error: "Failed to resend OTP" });
    }
}));

// Login routes
router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );

// Logout route
router.get("/logout", userController.logout);

module.exports = router;