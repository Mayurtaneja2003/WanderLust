const mongoose = require("mongoose");
const Review = require("./review.js");
const { required } = require("joi");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews:[
    {
        type:Schema.Types.ObjectId,
        ref:"Review",
    },
],
owner:{
    type: Schema.Types.ObjectId,
    ref: "User",
},
geometry:{
    type:{
        type: String,
        enum: ["Point"],
        required: true,
    },
    coordinates:{
        type: [Number],
        required: true,
    }
},
category: {
    type: [String],
    enum: {
        values: ['trending', 'iconic-cities', 'mountains', 'castles', 'pools', 'camping', 'farms', 'arctic'],
        message: '{VALUE} is not a valid category'
    },
    required: true
}
});

//middleware to delete reviews when listin g is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing){
    await Review.deleteMany({_id: {$in: listing.reviews}});
}})


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;