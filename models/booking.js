const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String,
    date: Date,
    days: Number,
    persons: Number,
});

module.exports = mongoose.model("Booking", bookingSchema);