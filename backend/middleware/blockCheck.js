// middleware/blockCheck.js
//
// Dùng làm middleware cho các route cần chặn tương tác giữa 2 user bị block nhau.
//
// Cách dùng:
//   const blockCheck = require("../middleware/blockCheck");
//   router.post("/messages", auth, blockCheck("receiverId"), C.sendMessage);
//   router.get("/posts/:authorId", auth, blockCheck("authorId", "param"), C.getPosts);
//
// Tham số:
//   field  — tên field chứa ID của người kia (mặc định lấy từ req.body)
//   source — "body" | "param" | "query"  (mặc định "body")

const User = require("../models/UserModel");

function blockCheck(field, source = "body") {
  return async (req, res, next) => {
    try {
      const requesterId = req.user?.id;
      if (!requesterId) return res.status(401).json({ msg: "Unauthorized" });

      let targetId;
      if (source === "param")  targetId = req.params[field];
      else if (source === "query") targetId = req.query[field];
      else targetId = req.body[field];

      // Nếu không có targetId thì bỏ qua (không phải route liên quan đến 1 user cụ thể)
      if (!targetId) return next();

      const [requester, target] = await Promise.all([
        User.findById(requesterId).select("blockedUsers"),
        User.findById(targetId).select("blockedUsers"),
      ]);

      if (!requester || !target) return next(); // user không tồn tại, để route tự xử lý

      const requesterBlockedTarget = requester.blockedUsers?.some(
        id => id.toString() === targetId.toString()
      );
      const targetBlockedRequester = target.blockedUsers?.some(
        id => id.toString() === requesterId.toString()
      );

      if (requesterBlockedTarget) {
        return res.status(403).json({
          msg: "Bạn đã chặn người dùng này. Hãy bỏ chặn để tiếp tục tương tác.",
          blocked: true,
          reason: "you_blocked",
        });
      }

      if (targetBlockedRequester) {
        return res.status(403).json({
          msg: "Không thể thực hiện hành động này.",
          blocked: true,
          reason: "blocked_by",
        });
      }

      next();
    } catch (err) {
      console.error("blockCheck middleware error:", err);
      next(); // không để lỗi middleware làm sập route
    }
  };
}

module.exports = blockCheck;