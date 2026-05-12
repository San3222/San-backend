const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
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

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email sending function
async function sendEmailNotification(contactData) {
    const { name, email, subject, message } = contactData;

    const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to: 'sandeepncs@gmail.com',
        subject: `📬 New Contact: ${subject}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 12px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">📩 New Contact Form Submission</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">From your Portfolio Website</p>
            </div>

            <!-- Body -->
            <div style="background: white; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 30%;">
                            <span style="color: #6b7280; font-size: 13px; font-weight: 600;">👤 NAME</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #1f2937; font-size: 15px; font-weight: 600;">${name}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #6b7280; font-size: 13px; font-weight: 600;">📧 EMAIL</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <a href="mailto:${email}" style="color: #3b82f6; font-size: 15px; text-decoration: none;">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #6b7280; font-size: 13px; font-weight: 600;">📌 SUBJECT</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="color: #1f2937; font-size: 15px;">${subject}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 14px 0; vertical-align: top;">
                            <span style="color: #6b7280; font-size: 13px; font-weight: 600;">💬 MESSAGE</span>
                        </td>
                        <td style="padding: 14px 0;">
                            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 3px solid #3b82f6; color: #374151; font-size: 14px; line-height: 1.7;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Reply Button -->
                <div style="text-align: center; margin-top: 24px;">
                    <a href="mailto:${email}?subject=Re: ${subject}" 
                       style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                        ↩️ Reply to ${name}
                    </a>
                </div>

                <!-- Footer -->
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Received from <strong>san3222.github.io</strong> • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </p>
                </div>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent ✅');
}

// POST — Save contact form + send email
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

        // 1. MongoDB mein save karo
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();
        console.log('Saved to MongoDB ✅');

        // 2. Email bhejo (save fail nahi karta agar email fail ho)
        try {
            await sendEmailNotification({ name, email, subject, message });
        } catch (emailError) {
            console.error('Email failed:', emailError.message);
            // Email fail ho to bhi success return karo — data save ho gaya
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully' 
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