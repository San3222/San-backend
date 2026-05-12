const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
})
    .then(() => console.log('MongoDB Connected ✅'))
    .catch(err => console.error('MongoDB Error:', err.message));

// Schema
const contactSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true },
    subject:   { type: String, required: true, trim: true },
    message:   { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    status:    { type: String, default: 'unread' }
});

const Contact = mongoose.model('Contact', contactSchema);

// POST — Save contact form
app.post('/api/contact', async (req, res) => {
    try {
        console.log('Request body:', req.body);

        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        res.status(201).json({ 
            success: true, 
            message: 'Message saved successfully' 
        });

    } catch (error) {
        console.error('Detailed Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            detail: error.message
        });
    }
});

// GET — All contacts
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'API running ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));