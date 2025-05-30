const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendBookingConfirmationEmail = async (booking) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: 'Booking Confirmation - Wanderlust',
        html: `
            <h1>Booking Confirmed!</h1>
            <p>Dear ${booking.firstName} ${booking.lastName},</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <ul>
                <li>Check-in Date: ${new Date(booking.date).toLocaleDateString()}</li>
                <li>Duration: ${booking.days} days</li>
                <li>Guests: ${booking.persons} persons</li>
                <li>Amount Paid: ₹${booking.amount}</li>
            </ul>
            <p>Thank you for choosing Wanderlust!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent');
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

const sendBookingCancellationEmail = async (booking) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: 'Booking Cancellation - Wanderlust',
        html: `
            <h1>Booking Cancelled</h1>
            <p>Dear ${booking.firstName} ${booking.lastName},</p>
            <p>Your booking has been cancelled as requested. Here are the details:</p>
            <ul>
                <li>Check-in Date: ${new Date(booking.date).toLocaleDateString()}</li>
                <li>Duration: ${booking.days} days</li>
                <li>Guests: ${booking.persons} persons</li>
                <li>Amount: ₹${booking.amount}</li>
            </ul>
            <p>We hope to serve you again in the future!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent');
    } catch (error) {
        console.error('Error sending cancellation email:', error);
    }
};

// Add these new email functions
const sendWelcomeEmail = async (user) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Welcome to Wanderlust',
        html: `
            <h1>Welcome to Wanderlust!</h1>
            <p>Dear ${user.username},</p>
            <p>Thank you for joining Wanderlust. We're excited to have you as a member of our community!</p>
            <p>With your new account, you can:</p>
            <ul>
                <li>Browse amazing properties</li>
                <li>Book your perfect stay</li>
                <li>Review your experiences</li>
                <li>And much more!</li>
            </ul>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Happy traveling!</p>
            <p>Best regards,<br>The Wanderlust Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent');
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

const sendLoginNotificationEmail = async (user) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'New Login to Your Wanderlust Account',
        html: `
            <h1>New Login Detected</h1>
            <p>Dear ${user.username},</p>
            <p>We detected a new login to your Wanderlust account.</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <p>If this wasn't you, please contact us immediately.</p>
            <p>Best regards,<br>The Wanderlust Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Login notification email sent');
    } catch (error) {
        console.error('Error sending login notification:', error);
    }
};

const sendVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Wanderlust',
        html: `
            <h1>Welcome to Wanderlust!</h1>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendBookingConfirmationEmail,
    sendBookingCancellationEmail,
    sendWelcomeEmail,
    sendLoginNotificationEmail,
    sendVerificationEmail
};