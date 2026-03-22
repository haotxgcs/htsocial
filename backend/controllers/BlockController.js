// controllers/BlockController.js
const User = require("../models/UserModel");

// ─────────────────────────────────────────────────────────────────
// Helper: kiểm tra block 2 chiều
// Trả về { blocked: true, reason } nếu có block
// ─────────────────────────────────────────────────────────────────
async function checkBlockBetween(userAId, userBId) {
  const [userA, userB] = await Promise.all([
    User.findById(userAId).select("blockedUsers"),
    User.findById(userBId).select("blockedUsers"),
  ]);
  if (!userA || !userB) return { blocked: false };

  const aBlockedB = userA.blockedUsers?.some(id => id.toString() === userBId.toString());
  const bBlockedA = userB.blockedUsers?.some(id => id.toString() === userAId.toString());

  if (aBlockedB) return { blocked: true, blocker: userAId, reason: "you_blocked" };
  if (bBlockedA) return { blocked: true, blocker: userBId, reason: "blocked_by" };
  return { blocked: false };
}

// =============================================
// POST /block
// Chặn một người dùng
// Body: { targetId }
// =============================================
exports.blockUser = async (req, res) => {
  try {
    const userId       = req.user.id;
    const { targetId } = req.body;

    if (!targetId) return res.status(400).json({ msg: "targetId is required" });
    if (String(userId) === String(targetId)) return res.status(400).json({ msg: "Không thể tự chặn mình" });

    const target = await User.findById(targetId).select("firstname lastname");
    if (!target) return res.status(404).json({ msg: "Người dùng không tồn tại" });

    // Kiểm tra đã block chưa
    const user = await User.findById(userId).select("blockedUsers");
    if (!user) return res.status(404).json({ msg: "Người dùng không tồn tại" });

    const alreadyBlocked = user.blockedUsers.some(id => id.toString() === String(targetId));
    if (alreadyBlocked) return res.status(400).json({ msg: "Đã chặn người dùng này rồi" });

    // Dùng $addToSet để atomic, tránh duplicate
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetId }
    });

    res.status(200).json({
      success: true,
      msg: `Đã chặn ${target.firstname} ${target.lastname}`,
    });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// POST /block/unblock
// Bỏ chặn một người dùng
// Body: { targetId }
// =============================================
exports.unblockUser = async (req, res) => {
  try {
    const userId       = req.user.id;
    const { targetId } = req.body;

    if (!targetId) return res.status(400).json({ msg: "targetId is required" });

    const user = await User.findById(userId).select("blockedUsers");
    if (!user) return res.status(404).json({ msg: "Người dùng không tồn tại" });

    const wasBlocked = user.blockedUsers.some(id => id.toString() === String(targetId));
    if (!wasBlocked) return res.status(400).json({ msg: "Bạn chưa chặn người này" });

    // Dùng $pull để atomic
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: targetId }
    });

    res.status(200).json({ success: true, msg: "Đã bỏ chặn thành công" });
  } catch (err) {
    console.error("unblockUser error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// GET /block/list
// Danh sách người mình đang chặn
// =============================================
exports.getBlockedList = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate("blockedUsers", "firstname lastname username avatar");

    if (!user) return res.status(404).json({ msg: "Người dùng không tồn tại" });

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers || [],
      total: user.blockedUsers?.length || 0,
    });
  } catch (err) {
    console.error("getBlockedList error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// GET /block/check/:targetId
// Kiểm tra trạng thái block giữa 2 user (2 chiều)
// =============================================
exports.checkBlock = async (req, res) => {
  try {
    const userId   = req.user.id;
    const { targetId } = req.params;

    const result = await checkBlockBetween(userId, targetId);

    res.status(200).json({
      success: true,
      isBlocked: result.blocked,
      // "you_blocked"  = mình đang chặn họ  → mình có thể unblock
      // "blocked_by"   = họ đang chặn mình  → chỉ thông báo "không thể tương tác"
      reason: result.reason || null,
    });
  } catch (err) {
    console.error("checkBlock error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Export helper để dùng ở các controller khác (Message, Post...)
exports.checkBlockBetween = checkBlockBetween;