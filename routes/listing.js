const express = require("express");
const router = express.Router();
const wrapAsync = require("../utilis/wrapAsync.js");
const  Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingcontroller = require("../controllers/listing.js");
const multer  = require('multer')
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

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

module.exports = router;
