const express = require("express");
const router = express.Router();
const wrapAsync = require("../utilis/wrapAsync.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingcontroller = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const { sendBookingCancellationEmail } = require('../config/nodemailer');

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

// 1. First define static routes
router.get("/history", isLoggedIn, async (req, res) => {
    try {
        // Only get bookings with valid listings
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'listing',
                select: 'title location image'
            })
            .sort({ createdAt: -1 });

        // Filter out bookings with null listings
        const validBookings = bookings.filter(booking => booking.listing != null);

        res.render("listings/history", { 
            bookings: validBookings,
            messages: req.flash()
        });
    } catch (error) {
        console.error("History Error:", error);
        req.flash("error", "Failed to load booking history");
        res.redirect("/listings");
    }
});

router.get("/new", isLoggedIn, listingcontroller.renderNewForm);

// 1. Search route first
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.redirect("/listings");
        }

        const listings = await Listing.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } }
            ]
        });

        // Return JSON for AJAX requests
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ listings });
        }

        // Render the full page for regular requests
        return res.render("listings/search", { listings, searchQuery: q });

    } catch (err) {
        console.error("Search Error:", err);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(500).json({ error: "Search failed" });
        }
        req.flash("error", "Error performing search");
        return res.redirect("/listings");
    }
});

// 2. Then filter routes
router.get("/filter/:category", async (req, res) => {
    try {
        const { category } = req.params;

        // Find listings where the category array includes the selected category
        const filteredListings = await Listing.find({
            category: category
        });

        res.render("listings/index", { 
            allListings: filteredListings,
            activeFilter: category
        });

    } catch (error) {
        console.error("Filter Error:", error);
        req.flash("error", "Error filtering listings");
        res.redirect("/listings");
    }
});

// 3. Then index routes
router.route("/")
    .get(wrapAsync(listingcontroller.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingcontroller.createListing));

// 4. Finally, dynamic ID routes
router.route("/:id")
    .get(wrapAsync(listingcontroller.showListing))
    .put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(listingcontroller.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingcontroller.destroyListing));

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingcontroller.renderEditForm));

module.exports = router;
