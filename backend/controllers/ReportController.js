const Report = require("../models/ReportModel");
const User   = require("../models/UserModel");
const { notify } = require("./NotificationController");

// =============================================
// POST /reports  — Tạo report mới
// =============================================
exports.createReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !reason) {
      return res.status(400).json({ msg: "targetType and reason are required" });
    }

    // Không tự report chính mình
    if (targetType === "user" && String(targetId) === String(reporterId)) {
      return res.status(400).json({ msg: "You cannot report yourself" });
    }

    // Kiểm tra đã report chưa (trừ "other" vì không có targetId)
    if (targetType !== "other" && targetId) {
      const existing = await Report.findOne({
        reporter: reporterId,
        targetType,
        targetId
      });
      if (existing) {
        return res.status(409).json({ msg: "You have already reported this" });
      }
    }

    const report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId: targetType !== "other" ? targetId : null,
      reason,
      description: description?.trim() || ""
    });

    await notify({
    recipientId: reporterId,
    senderId:    null,
    type:        "report_received",
    meta:        { targetType, reason, reportId: report._id }
    });

    res.status(201).json({ success: true, msg: "Report submitted successfully", report });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "You have already reported this" });
    }
    console.error("createReport:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// GET /reports  — Admin: lấy danh sách reports
// =============================================
exports.getReports = async (req, res) => {
  try {
    const page       = parseInt(req.query.page)   || 1;
    const limit      = parseInt(req.query.limit)  || 20;
    const status     = req.query.status     || "";
    const targetType = req.query.targetType || "";

    const query = {};
    if (status)     query.status     = status;
    if (targetType) query.targetType = targetType;

    const [reports, total, stats] = await Promise.all([
      Report.find(query)
        .populate("reporter", "firstname lastname username avatar")
        .populate("resolvedBy", "firstname lastname")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(query),
      // Stats theo status
      Report.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    // Format stats
    const statsMap = { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
    stats.forEach(s => { if (statsMap[s._id] !== undefined) statsMap[s._id] = s.count; });

    res.json({
      success: true,
      reports,
      total,
      page,
      hasMore: page * limit < total,
      stats: statsMap
    });
  } catch (err) {
    console.error("getReports:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// PATCH /reports/:id/status  — Admin: cập nhật status
// =============================================
exports.updateStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote: adminNote || "",
        resolvedBy: ["resolved", "dismissed"].includes(status) ? req.user.id : null,
        resolvedAt: ["resolved", "dismissed"].includes(status) ? new Date() : null
      },
      { new: true }
    ).populate("reporter", "firstname lastname username");

    if (!report) return res.status(404).json({ msg: "Report not found" });

    if (["resolved", "dismissed"].includes(status)) {
    await notify({
        recipientId: report.reporter._id,
        senderId:    req.user.id,   // admin
        type:        "report_resolved",
        meta:        {
        status,
        adminNote: adminNote || "",
        reportId: report._id
        }
    });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("updateStatus:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE /reports/:id  — Admin: xóa report
// =============================================
exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Report deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// GET /reports/my  — User: xem report của mình
// =============================================
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("resolvedBy", "firstname lastname"); // biết admin nào xử lý
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};