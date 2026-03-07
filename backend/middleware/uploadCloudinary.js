const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../services/cloudinary");

/* ===============================
   ✅ Cloudinary Storage Config
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "htsocial_marketplace",

    allowed_formats: ["jpg", "png", "jpeg", "webp"],

    // ✅ đặt tên file rõ ràng
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.split(".")[0]
  }
});

/* ===============================
   ✅ Multer Upload Middleware
================================ */
const uploadCloud = multer({
  storage,

  // ✅ limit size ảnh (5MB)
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = uploadCloud;
