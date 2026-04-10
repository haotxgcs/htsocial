const Contact = require("../models/ContactModel");
const { contactAdminTemplate, contactReplyTemplate } = require("../services/emailTemplates");
const { sendContact, sendContactReply } = require("../services/emailService");

// POST /contact — Không cần auth
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ msg: "Name, email and message are required" });
    if (!subject)
      return res.status(400).json({ msg: "Please select a reason" });

    const contact = await Contact.create({ name, email, subject, message });

    await sendContact({ name, email, subject, message });

    res.status(201).json({ success: true, msg: "Message sent successfully", contact });
  } catch (err) {
    console.error("createContact:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// GET /contact — Admin only
exports.getContacts = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";

    const query = {};
    if (status) query.status = status;

    const [contacts, total, unreadCount] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Contact.countDocuments(query),
      Contact.countDocuments({ status: "unread" })
    ]);

    res.json({ success: true, contacts, total, page, hasMore: page*limit < total, unreadCount });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// PATCH /contact/:id/reply — Admin only
exports.replyContact = async (req, res) => {
  try {
    const { adminReply } = req.body;
    if (!adminReply) return res.status(400).json({ msg: "Reply is required" });

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { adminReply, status: "replied", repliedAt: new Date() },
      { new: true }
    );
    if (!contact) return res.status(404).json({ msg: "Not found" });

    await sendContactReply({
      to:              contact.email,
      name:            contact.name,
      subject:         contact.subject,
      originalMessage: contact.message,
      adminReply,
    });

    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// PATCH /contact/:id/read — Admin only
exports.markRead = async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { status: "read" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// DELETE /contact/:id — Admin only
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};