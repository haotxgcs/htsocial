const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const UserAddressController = require("../controllers/UserAddressController");

router.get("/", auth, UserAddressController.getAddresses);
router.post("/", auth, UserAddressController.addAddress);
router.put("/:addressId", auth, UserAddressController.updateAddress);
router.delete("/:addressId", auth, UserAddressController.deleteAddress);

module.exports = router;
