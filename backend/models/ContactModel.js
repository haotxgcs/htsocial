const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, maxlength: 100 },
  email:   { type: String, required: true, maxlength: 200 },
  subject: { type: String, default: "Account Issue", maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  status:  { type: String, enum: ["unread", "read", "replied"], default: "unread", index: true },
  adminReply: { type: String, default: "" },
  repliedAt:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);