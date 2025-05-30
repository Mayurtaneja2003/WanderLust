const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const Booking = require("../models/booking");

module.exports.index = async (req, res) => {
    try {
        let query = Listing.find({});
        
        // If user is logged in, exclude their listings
        if (req.user) {
            query = query.where('owner').ne(req.user._id);
        }
        
        const listings = await query.exec();
        res.render("listings/index", { 
            listings,
            allListings: listings, // Include both for compatibility
            activeFilter: null
        });
    } catch (err) {
        console.error("Error:", err);
        req.flash("error", "Error loading listings");
        res.render("listings/index", { 
            listings: [],
            allListings: [],
            activeFilter: null
        });
    }
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate(
        {
            path:"reviews", 
            populate:{
                path: "author",
            },
        }).populate("owner");
    if(!listing){
        req.flash("error", " Listing you requested for does not exist");
       return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async(req, res, next) => {
    try {
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        }).send();      

        let url = req.file.path;
        let filename = req.file.filename;
        
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url, filename};
        newListing.geometry = response.body.features[0].geometry;

        // Ensure category is always an array
        if (!Array.isArray(req.body.listing.category)) {
            newListing.category = req.body.listing.category ? [req.body.listing.category] : [];
        }

        let savedListing = await newListing.save();
        console.log(savedListing);    
        req.flash("success", "New Listing Created");
        res.redirect("/listings");  
    } catch (err) {
        console.error(err);
        req.flash("error", "Error creating listing");
        res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", " Listing you requested for does not exist");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs",{listing, originalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", " Listing Delete");
    res.redirect("/listings");
}

module.exports.handleBooking = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, email, date, days, persons } = req.body;

    // Save booking information to the database
    const booking = new Booking({
        listing: id,
        firstName,
        lastName,
        phoneNumber,
        email,
        date,
        days,
        persons,
    });


    // Redirect to a payment gateway page (e.g., Razorpay, Stripe)
    res.redirect(`/listings/${id}/payment`);
};

module.exports.filterByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        // Build the query object
        let query = {
            category: category  // Match the selected category
        };

        // If user is logged in, add condition to exclude their listings
        if (req.user) {
            query.owner = { $ne: req.user._id };
        }

        // Execute the query with both conditions
        const filteredListings = await Listing.find(query)
            .populate("owner");

        res.render("listings/index", {
            listings: filteredListings,
            allListings: filteredListings,
            activeFilter: category
        });

    } catch (error) {
        console.error("Filter Error:", error);
        req.flash("error", "Error filtering listings");
        res.redirect("/listings");
    }
};
