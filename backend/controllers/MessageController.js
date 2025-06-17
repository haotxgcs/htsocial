const Message = require('../models/MessageModel');

// Gửi tin nhắn mới
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = new Message({ sender: senderId, receiver: receiverId, content });
    await message.save();
    res.status(201).json(message);

    res.status(200).json({ msg: "Message added successfully!", message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ msg: 'Failed to send message' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    })
      .sort({ timestamp: 1 }) // sắp xếp theo thời gian
      .populate("sender", "firstname lastname username avatar")
      .populate("receiver", "firstname lastname username avatar");

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({ msg: 'Failed to fetch messages' });
  }
};

// ✅ Thu hồi tin nhắn (revoke message)
exports.recallMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });

    // Đánh dấu là đã thu hồi (giữ lại tin nhắn nhưng hiển thị 'Đã thu hồi')
    message.content = "";
    message.recalled = true;
    await message.save();

    res.status(200).json({ msg: "Message recalled", message });
  } catch (err) {
    console.error("Recall message error:", err);
    res.status(500).json({ msg: "Failed to recall message" });
  }
};

// ✅ Xoá vĩnh viễn tin nhắn
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const deleted = await Message.findByIdAndDelete(messageId);
    if (!deleted) return res.status(404).json({ msg: "Message not found" });

    res.status(200).json({ msg: "Message deleted" });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ msg: "Failed to delete message" });
  }
};
