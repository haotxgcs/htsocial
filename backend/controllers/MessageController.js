const Message = require('../models/MessageModel');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = new Message({ sender: senderId, receiver: receiverId, content });
    await message.save();
    res.status(201).json(message);
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
    }).sort({ timestamp: 1 }); // theo thời gian tăng dần

    res.status(200).json(messages);
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({ msg: 'Failed to fetch messages' });
  }
};
