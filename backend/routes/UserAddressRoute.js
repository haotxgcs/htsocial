const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require("../controllers/UserAddressController");

router.get("/", auth, getAddresses);
router.post("/", auth, addAddress);
router.put("/:addressId", auth, updateAddress);
router.delete("/:addressId", auth, deleteAddress);
router.patch("/:id/default", auth, setDefaultAddress);


module.exports = router;
