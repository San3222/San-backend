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
        subject: `📬 New Contact: ${subject}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family: Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding: 24px 12px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px 24px; text-align:center;">
                            <div style="font-size:36px; margin-bottom:10px;">📩</div>
                            <h1 style="color:white; margin:0; font-size:20px; font-weight:700; letter-spacing:0.5px;">New Contact Form Submission</h1>
                            <p style="color:rgba(255,255,255,0.80); margin:8px 0 0; font-size:13px;">From your Portfolio Website</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="background:#ffffff; padding: 28px 24px;">

                            <!-- Name -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                                <tr>
                                    <td style="background:#f8fafc; border-radius:10px; padding:14px 16px; border-left: 4px solid #3b82f6;">
                                        <p style="margin:0 0 4px; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">👤 Name</p>
                                        <p style="margin:0; font-size:16px; font-weight:700; color:#1f2937;">${name}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Email -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                                <tr>
                                    <td style="background:#f8fafc; border-radius:10px; padding:14px 16px; border-left: 4px solid #8b5cf6;">
                                        <p style="margin:0 0 4px; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">📧 Email</p>
                                        <a href="mailto:${email}" style="margin:0; font-size:15px; font-weight:600; color:#3b82f6; text-decoration:none;">${email}</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Subject -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                                <tr>
                                    <td style="background:#f8fafc; border-radius:10px; padding:14px 16px; border-left: 4px solid #10b981;">
                                        <p style="margin:0 0 4px; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">📌 Subject</p>
                                        <p style="margin:0; font-size:15px; font-weight:600; color:#1f2937;">${subject}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Message -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td style="background:#f8fafc; border-radius:10px; padding:14px 16px; border-left: 4px solid #f59e0b;">
                                        <p style="margin:0 0 8px; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">💬 Message</p>
                                        <p style="margin:0; font-size:14px; color:#374151; line-height:1.7;">${message.replace(/\n/g, '<br>')}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Reply Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:${email}?subject=Re: ${subject}" 
                                           style="display:inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color:white; padding:14px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:15px;">
                                            ↩️ Reply to ${name}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc; padding:16px 24px; text-align:center; border-top:1px solid #e5e7eb;">
                            <p style="margin:0; color:#9ca3af; font-size:12px;">
                                Received from <strong style="color:#6b7280;">san3222.github.io</strong>
                            </p>
                            <p style="margin:4px 0 0; color:#9ca3af; font-size:11px;">
                                ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

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