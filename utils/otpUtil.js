function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function isOTPValid(generatedAt) {
    const now = new Date();
    const diffInMinutes = (now - generatedAt) / (1000 * 60);
    return diffInMinutes <= 10; // OTP valid for 10 minutes
}

module.exports = { generateOTP, isOTPValid };