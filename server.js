const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL,],
    methods: ['GET', 'POST'],
    credentials: true
}));

// app.use(cors({
//     origin: function (origin, callback) {
//         const allowed = [
//             'https://san3222.github.io',
//             'http://localhost:3000',
//             'http://127.0.0.1:5500',  // VS Code Live Server
//             'http://localhost:5500'
//         ];
//         // Allow requests with no origin (Postman, curl)
//         if (!origin || allowed.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'OPTIONS'],
//     credentials: true
// }));

// OPTIONS preflight handle karo
// app.options('*', cors());


app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

// Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'unread' } // unread/read
});

const Contact = mongoose.model('Contact', contactSchema);

// POST — Save contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Save to MongoDB
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        res.status(201).json({
            success: true,
            message: 'Message saved successfully'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET — All contacts (optional: for your own dashboard)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));