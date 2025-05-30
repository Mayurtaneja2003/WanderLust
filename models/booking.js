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
    amount: Number,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

// Add middleware to handle deleted listings
bookingSchema.pre('find', function(next) {
    this.populate({
        path: 'listing',
        select: 'title location image'
    });
    next();
});

bookingSchema.post('save', async function(doc) {
    if (!doc.listing) {
        doc.status = 'cancelled';
        await doc.save();
    }
});

module.exports = mongoose.model("Booking", bookingSchema);