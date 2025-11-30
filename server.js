const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// 1. DATABASE CONNECTION
// PASTE YOUR MONGODB STRING BELOW inside the quotes
mongoose.connect('mongodb+srv://gurukrishnakumar123_db_user:kmzYcx0j5TVZeAkp@cluster0.j4ltzrz.mongodb.net/?appName=Cluster0')
    .then(() => console.log("Database Connected"))
    .catch(err => console.error(err));

// User Model
const UserSchema = new mongoose.Schema({
    email: String, // We will identify users by email for simplicity
    isPremium: { type: Boolean, default: false },
    notes: [String]
});
const User = mongoose.model('User', UserSchema);

// 2. PAYMENT CONFIGURATION
// PASTE YOUR RAZORPAY KEYS BELOW
const razorpay = new Razorpay({
    key_id: 'rzp_test_RlZh1ejir4OjTe',
    key_secret: 'njmrVMw4oAgTaHryTV4aWg6E',
});

// --- API ROUTES ---

// Login or Register (Simplified)
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        user = new User({ email, notes: [] }); // Create new if not exists
        await user.save();
    }
    res.json(user);
});

// Add Note
app.post('/api/add-note', async (req, res) => {
    const { email, note } = req.body;
    const user = await User.findOne({ email });

    if (!user.isPremium && user.notes.length >= 5) {
        return res.status(403).json({ error: "Limit reached" });
    }

    user.notes.unshift(note);
    await user.save();
    res.json({ success: true, notes: user.notes });
});

// Create Payment Order
app.post('/api/create-order', async (req, res) => {
    const { amount } = req.body; // 10 or 100
    const options = {
        amount: amount * 100, // Razorpay takes amount in paisa (10 rs = 1000 paisa)
        currency: "INR",
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Verify Payment Success
app.post('/api/verify-payment', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    user.isPremium = true;
    await user.save();
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));