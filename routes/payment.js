const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Booking = require('../models/booking');
const { isLoggedIn } = require('../middleware');
const { sendBookingConfirmationEmail } = require('../config/nodemailer');

router.post('/create-checkout-session', isLoggedIn, async (req, res) => {
    try {
        console.log('Received data:', req.body); // Add this line for debugging
        const { listingId, firstName, lastName, email, phoneNumber, date, days, persons, totalAmount } = req.body;

        if (!listingId) {
            throw new Error('Listing ID is required');
        }

        // Create booking first
        const booking = new Booking({
            listing: listingId,
            user: req.user._id, // Add this line
            firstName,
            lastName,
            phoneNumber,
            email,
            date,
            days,
            persons,
            amount: totalAmount,
            status: 'pending'
        });

        await booking.save();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Room Booking',
                            description: `${days} days stay for ${persons} persons`,
                        },
                        unit_amount: Math.round(totalAmount * 100), // Convert to paise
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/listings`,
            customer_email: email,
        });

        // Update booking with session ID
        booking.stripeSessionId = session.id;
        await booking.save();

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
});

// Update the success route
router.get('/success', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        
        // Update booking with payment details
        const booking = await Booking.findOneAndUpdate(
            { stripeSessionId: req.query.session_id },
            { 
                status: 'confirmed',
                stripePaymentIntentId: session.payment_intent
            },
            { new: true }
        ).populate('listing');

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Send confirmation email
        await sendBookingConfirmationEmail(booking);

        req.flash('success', 'Payment successful! Booking confirmed.');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Could not confirm booking');
        res.redirect('/listings');
    }
});

module.exports = router;