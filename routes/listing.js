const express = require("express");
const router = express.Router();
const wrapAsync = require("../utilis/wrapAsync.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingcontroller = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const { sendBookingCancellationEmail } = require('../config/nodemailer');

// Add the history route BEFORE the :id routes
router.get("/history", isLoggedIn, async (req, res) => {
    try {
        // Fetch bookings with listing details
        const bookings = await Booking.find({ user: req.user._id })  // Changed from email to user
            .populate('listing')
            .sort({ createdAt: -1 });

        res.render("listings/history", { bookings });
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to fetch booking history");
        res.redirect("/listings");
    }
});

//index and create route
router.route("/")
.get(wrapAsync(listingcontroller.index))
.post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingcontroller.createListing));

// New route
router.get("/new", isLoggedIn, listingcontroller.renderNewForm);

//show, update and delete route
router.route("/:id")
.get(wrapAsync(listingcontroller.showListing))
.put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(listingcontroller.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync(listingcontroller.destroyListing));

//edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingcontroller.renderEditForm));

// Add this route BEFORE other :id routes
router.post("/booking/:id/cancel", isLoggedIn, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('listing')
            .populate('user');
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Send cancellation email
        await sendBookingCancellationEmail(booking);

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

module.exports = router;
