const express = require("express");
const router = express.Router();
const wrapAsync = require("../utilis/wrapAsync.js");
const  Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const {handleBooking} = require("../controllers/listing.js")
const listingcontroller = require("../controllers/listing.js");
const multer  = require('multer')
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//index and create route
router.route("/")
.get(wrapAsync(listingcontroller.index))
.post(isLoggedIn, upload.single('listing[image]') , validateListing , wrapAsync(listingcontroller.createListing));

// New route
router.get("/new",isLoggedIn,listingcontroller.renderNewForm);

//show, update and delete route
router.route("/:id")
.get(wrapAsync(listingcontroller.showListing))
.put ( isLoggedIn,isOwner, upload.single('listing[image]') , validateListing , wrapAsync(listingcontroller.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingcontroller.destroyListing));

//edit route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingcontroller.renderEditForm));

// Route to handle booking and payment
router.post("/:id/book", async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, email, date, days, persons, totalAmount } = req.body;

    // Save booking details in the database (optional)

    // Redirect to the payment page
    res.render("listings/payment", {
        listingId: id,
        firstName,
        lastName,
        phoneNumber,
        email,
        date,
        days,
        persons,
        amount: totalAmount,
    });
});

router.get("/:id/payment", (req, res) => {
    res.render("listings/payment", { listingId: req.params.id });
});

router.post("/payment/success", async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify the payment signature
    const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (generated_signature === razorpay_signature) {
        // Payment is successful
        req.flash("success", "Payment successful! Thank you for booking.");
        res.redirect("/listings"); // Redirect to the listings page
    } else {
        // Payment verification failed
        req.flash("error", "Payment verification failed. Please try again.");
        res.redirect("/listings"); // Redirect to the listings page
    }
});

router.get("/payment/failure/:id", (req, res) => {
    const { id } = req.params;

    // Flash an error message
    req.flash("error", "Payment failed or was canceled. Please try again.");

    // Redirect back to the listing page
    res.redirect(`/listings/${id}`);
});

module.exports = router;
