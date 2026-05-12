const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
})
    .then(() => console.log('MongoDB Connected ✅'))
    .catch(err => console.error('MongoDB Error:', err.message));

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'unread' }
});

const Contact = mongoose.model('Contact', contactSchema);

// Email function — Resend
async function sendEmailNotification(contactData) {
    const { name, email, subject, message } = contactData;

    const { data, error } = await resend.emails.send({
        from: 'Portfolio <onboarding@resend.dev>',
        to: process.env.TO_EMAIL,
        subject: `New Contact: ${subject}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:20px; background:#ffffff; font-family: Arial, sans-serif; color:#333333;">

    <h2 style="margin:0 0 8px;">New Contact Form Submission</h2>
    <p style="margin:0 0 20px; color:#666666; font-size:14px;">From your Portfolio Website — san3222.github.io</p>

    <hr style="border:none; border-top:1px solid #dddddd; margin-bottom:20px;">

    <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
        <tr style="background:#f5f5f5;">
            <td style="padding:10px 14px; font-size:13px; font-weight:bold; color:#555555; width:100px; border:1px solid #dddddd;">Name</td>
            <td style="padding:10px 14px; font-size:14px; color:#222222; border:1px solid #dddddd;">${name}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px; font-size:13px; font-weight:bold; color:#555555; border:1px solid #dddddd;">Email</td>
            <td style="padding:10px 14px; font-size:14px; border:1px solid #dddddd;">
                <a href="mailto:${email}" style="color:#1a73e8; text-decoration:none;">${email}</a>
            </td>
        </tr>
        <tr style="background:#f5f5f5;">
            <td style="padding:10px 14px; font-size:13px; font-weight:bold; color:#555555; border:1px solid #dddddd;">Subject</td>
            <td style="padding:10px 14px; font-size:14px; color:#222222; border:1px solid #dddddd;">${subject}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px; font-size:13px; font-weight:bold; color:#555555; vertical-align:top; border:1px solid #dddddd;">Message</td>
            <td style="padding:10px 14px; font-size:14px; color:#222222; line-height:1.6; border:1px solid #dddddd;">
                ${message.replace(/\n/g, '<br>')}
            </td>
        </tr>
    </table>

    <br>
    <a href="mailto:${email}?subject=Re: ${subject}" 
       style="display:inline-block; padding:10px 22px; background:#1a73e8; color:#ffffff; text-decoration:none; font-size:14px; border-radius:4px;">
        Reply to ${name}
    </a>

    <hr style="border:none; border-top:1px solid #dddddd; margin-top:24px;">
    <p style="font-size:12px; color:#999999; margin:8px 0 0;">
        ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </p>

</body>
</html>
        `
    });

    if (error) throw new Error(error.message);
    console.log('Email sent ✅', data);
}

// POST — Save + Email
app.post('/api/contact', async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();
        console.log('Saved to MongoDB ✅');

        try {
            await sendEmailNotification({ name, email, subject, message });
        } catch (emailError) {
            console.error('Email failed:', emailError.message);
        }

        res.status(201).json({ success: true, message: 'Message sent successfully' });

    } catch (error) {
        console.error('Detailed Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', detail: error.message });
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

app.get('/', (req, res) => res.json({ status: 'API running ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));