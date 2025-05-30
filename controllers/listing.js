const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const Booking = require("../models/booking");

module.exports.index =  async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index", {allListings});
 }

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

module.exports.createListing = async(req,res,next)=>{
   let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
        .send();      
     

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();
    console.log(savedListing);    
    req.flash("success", "New Listing Created");
    res.redirect("/listings");  
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

    await booking.save();

    // Redirect to a payment gateway page (e.g., Razorpay, Stripe)
    res.redirect(`/listings/${id}/payment`);
};

module.exports.filterByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        let query = {};

        // Case-insensitive search and array contains
        const listings = await Listing.find({
            category: {
                $elemMatch: {
                    $regex: new RegExp(category, 'i')
                }
            }
        });

        // If no listings found, try with similar categories
        if (listings.length === 0) {
            // Define category aliases
            const categoryAliases = {
                'arctic': ['winter', 'snow', 'ice'],
                'farms': ['ranch', 'countryside', 'farm'],
                'mountains': ['alpine', 'hills', 'mountain'],
                'pools': ['swimming', 'pool', 'infinity'],
                'camping': ['camp', 'outdoor', 'wilderness'],
                'castles': ['palace', 'fortress', 'manor']
            };

            if (categoryAliases[category]) {
                const altListings = await Listing.find({
                    $or: [
                        {
                            category: {
                                $elemMatch: {
                                    $in: categoryAliases[category]
                                }
                            }
                        },
                        {
                            description: {
                                $regex: new RegExp(categoryAliases[category].join('|'), 'i')
                            }
                        }
                    ]
                });
                
                if (altListings.length > 0) {
                    listings.push(...altListings);
                }
            }
        }

        // Remove duplicates if any
        const uniqueListings = Array.from(new Set(listings.map(l => l._id)))
            .map(id => listings.find(l => l._id === id));

        res.render("listings/index", {
            allListings: uniqueListings,
            activeFilter: category
        });

    } catch (error) {
        console.error("Filter Error:", error);
        req.flash("error", "Error filtering listings");
        res.redirect("/listings");
    }
};
