const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../services/cloudinary");

/* ===============================
   Marketplace image storage
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "htsocial_marketplace",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.split(".")[0]
  }
});

const uploadCloud = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/* ===============================
   Refund evidence storage
   Supports: images + videos
================================ */
const evidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "htsocial_refund_evidence",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "webm"]
        : ["jpg", "png", "jpeg", "webp"],
      public_id: Date.now() + "-" + file.originalname.split(".")[0]
    };
  }
});

const uploadEvidence = multer({
  storage: evidenceStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB cho video
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image") || file.mimetype.startsWith("video");
    ok ? cb(null, true) : cb(new Error("Only images and videos are allowed"), false);
  }
});

module.exports = uploadCloud;
module.exports.uploadEvidence = uploadEvidence;