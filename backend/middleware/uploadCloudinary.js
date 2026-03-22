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

/* ===============================
   Avatar storage
================================ */
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "htsocial_avatars",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
    public_id: (req, file) => `avatar_${req.params.id}_${Date.now()}`
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ===============================
   Cover photo storage
================================ */
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "htsocial_covers",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 1200, height: 400, crop: "fill", quality: "auto" }],
    public_id: (req, file) => `cover_${req.params.id}_${Date.now()}`
  }
});

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ===============================
   Post media storage (image + video)
================================ */
const postMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "htsocial_posts",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "webm"]
        : ["jpg", "png", "jpeg", "webp"],
      transformation: isVideo
        ? []
        : [{ quality: "auto", fetch_format: "auto" }],
      public_id: `post_${Date.now()}_${file.originalname.split(".")[0]}`
    };
  }
});

const uploadPostMedia = multer({
  storage: postMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB cho video
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image") || file.mimetype.startsWith("video");
    ok ? cb(null, true) : cb(new Error("Only images and videos are allowed"), false);
  }
});

module.exports = uploadCloud;
module.exports.uploadEvidence  = uploadEvidence;
module.exports.uploadAvatar    = uploadAvatar;
module.exports.uploadCover     = uploadCover;
module.exports.uploadPostMedia = uploadPostMedia;