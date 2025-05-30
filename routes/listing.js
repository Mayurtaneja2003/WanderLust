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

// ============== Booking Routes ==============
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

// ============== Static Routes ==============
// Booking History Route
router.get("/history", isLoggedIn, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('listing')
            .sort({ createdAt: -1 });

        res.render("listings/history", { 
            bookings,
            pageTitle: "My Bookings"
        });
    } catch (error) {
        console.error("Booking History Error:", error);
        req.flash("error", "Failed to load booking history");
        res.redirect("/listings");
    }
});

// My Listings Route
router.get("/my", isLoggedIn, async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id })
            .populate('owner');
        res.render("listings/my", { 
            listings,
            pageTitle: "My Listings"
        });
    } catch (error) {
        console.error("My Listings Error:", error);
        req.flash("error", "Failed to load your listings");
        res.redirect("/listings");
    }
});

// New Listing Route
router.get("/new", isLoggedIn, listingcontroller.renderNewForm);

// ============== Search & Filter Routes ==============
// Search Route
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.redirect("/listings");

        const listings = await Listing.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } }
            ]
        }).populate('owner');

        return req.headers.accept?.includes('application/json')
            ? res.json({ listings })
            : res.render("listings/search", { 
                listings, 
                searchQuery: q,
                pageTitle: "Search Results" 
              });

    } catch (err) {
        console.error("Search Error:", err);
        return handleSearchError(req, res, err);
    }
});

// Category Filter Route
router.get("/filter/:category", async (req, res) => {
    try {
        const { category } = req.params;
        
        // Find listings with matching category
        const listings = await Listing.find({
            category: category
        });

        res.render("listings/index", { 
            listings,             // Use consistent variable name
            allListings: listings, // For backward compatibility
            activeFilter: category
        });

    } catch (error) {
        console.error("Filter Error:", error);
        req.flash("error", "Error filtering listings");
        res.redirect("/listings");
    }
});

// ============== Main Routes ==============
// Index Routes
router.route("/")
    .get(wrapAsync(listingcontroller.index))
    .post(
        isLoggedIn, 
        upload.single('listing[image]'), 
        validateListing, 
        wrapAsync(listingcontroller.createListing)
    );

// ============== Dynamic Routes ==============
router.route("/:id")
    .get(wrapAsync(listingcontroller.showListing))
    .put(
        isLoggedIn, 
        isOwner, 
        upload.single('listing[image]'), 
        validateListing, 
        wrapAsync(listingcontroller.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingcontroller.destroyListing));

router.get("/:id/edit", 
    isLoggedIn, 
    isOwner, 
    wrapAsync(listingcontroller.renderEditForm)
);

// Helper function for search error handling
const handleSearchError = (req, res, err) => {
    if (req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ error: "Search failed" });
    }
    req.flash("error", "Error performing search");
    return res.redirect("/listings");
};

module.exports = router;
