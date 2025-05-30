const User = require("../models/user");
const { generateOTP, isOTPValid } = require("../utils/otpUtil");
const { sendVerificationEmail, sendWelcomeEmail, sendLoginNotificationEmail } = require('../config/nodemailer');

module.exports.renderSignupForm = (req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signup = async(req, res) => {
    try {
        const { email, username, password } = req.body;
        const otp = generateOTP();
        
        // Save user data and OTP in session
        req.session.tempUser = {
            email,
            username,
            password,
            otp: {
                code: otp,
                generatedAt: new Date()
            }
        };

        await sendVerificationEmail(email, otp);
        res.render("users/verify-otp", { email });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const tempUser = req.session.tempUser;

        if (!tempUser) {
            req.flash("error", "Session expired. Please signup again.");
            return res.redirect("/signup");
        }

        // Verify OTP
        if (tempUser.otp.code !== otp) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect("back");
        }

        // Check OTP expiration (50 seconds)
        const now = new Date();
        const otpAge = (now - new Date(tempUser.otp.generatedAt)) / 1000;
        if (otpAge > 50) {
            req.flash("error", "OTP has expired. Please request a new one.");
            return res.redirect("back");
        }

        // Register user
        const registeredUser = await User.register(
            new User({ 
                email: tempUser.email, 
                username: tempUser.username
            }), 
            tempUser.password
        );

        // Login after registration
        req.login(registeredUser, (err) => {
            if (err) {
                req.flash("error", "Something went wrong");
                return res.redirect("/signup");
            }
            delete req.session.tempUser;
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login = async(req,res)=>{
    req.flash("success","Welcome back to Wanderlust!");
    // Send login notification
    sendLoginNotificationEmail(req.user);
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    })
};
