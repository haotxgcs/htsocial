const User = require("../models/UserModel");

/**
 * =======================
 * GET ALL ADDRESSES
 * =======================
 */
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addressBook");
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    res.json({
      success: true,
      addresses: user.addressBook || []
    });
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

/**
 * =======================
 * ADD NEW ADDRESS
 * =======================
 */
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const {
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      note,
      isDefault
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !address) {
      return res.status(400).json({
        success: false,
        msg: "Full name, phone and address are required"
      });
    }

    // Optional: validate phone format
    if (!/^[0-9]{9,11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid phone number"
      });
    }

    const isFirstAddress = user.addressBook.length === 0;

    // Nếu đặt làm default → unset default cũ
    if (isDefault) {
      user.addressBook.forEach(a => (a.isDefault = false));
    }

    user.addressBook.push({
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      note,
      // address đầu tiên LUÔN là default
      isDefault: isFirstAddress || !!isDefault
    });

    await user.save();

    res.json({
      success: true,
      msg: "Address added successfully",
      addresses: user.addressBook
    });
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

/**
 * =======================
 * UPDATE ADDRESS
 * =======================
 */
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const address = user.addressBook.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        msg: "Address not found"
      });
    }

    // Nếu set default → unset các address khác
    if (req.body.isDefault === true) {
      user.addressBook.forEach(a => (a.isDefault = false));
      address.isDefault = true;
    }

    // Update các field khác (tránh ghi đè isDefault sai)
    const { isDefault, ...rest } = req.body;
    Object.assign(address, rest);

    await user.save();

    res.json({
      success: true,
      msg: "Address updated successfully",
      addresses: user.addressBook
    });
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

/**
 * =======================
 * DELETE ADDRESS
 * =======================
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const addressIndex = user.addressBook.findIndex(
      a => a._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        msg: "Address not found"
      });
    }

    const wasDefault = user.addressBook[addressIndex].isDefault;

    // Remove address
    user.addressBook.splice(addressIndex, 1);

    // Nếu xóa default → set address đầu tiên còn lại làm default
    if (
      wasDefault &&
      user.addressBook.length > 0 &&
      !user.addressBook.some(a => a.isDefault)
    ) {
      user.addressBook[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      msg: "Address deleted successfully",
      addresses: user.addressBook
    });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

// Set Default Address
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // ✅ Find address
    const addr = user.addressBook.id(addressId);

    if (!addr) {
      return res.status(404).json({
        success: false,
        msg: "Address not found"
      });
    }

    // ✅ Clear old default
    user.addressBook.forEach(a => (a.isDefault = false));

    // ✅ Set new default
    addr.isDefault = true;

    await user.save();

    return res.json({
      success: true,
      msg: "Default address updated ✅",
      addresses: user.addressBook
    });

  } catch (err) {
    console.error("Set default error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};


