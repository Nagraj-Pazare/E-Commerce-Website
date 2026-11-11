import Address from "../models/addressModel.js";

export const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const addresses = await Address.find({ userId }).sort({ isDefault: -1 });
    req.addresses = addresses;
    // return res.status(200).json({
    //   success: true,
    //   addresses,
    // });
    next();
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const addAddress = async (req, res) => {
  try {
    
    const { isCart } = req.body;
    const userId = req.user.userId || req.user._id;
    const {
      redirectTo,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      stateOrProvince,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const newAddress = await Address.create({
      userId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      stateOrProvince,
      postalCode,
      country,
      isDefault: isDefault || false,
    });

    return res.status(201).redirect(redirectTo);
  } catch (error) {
    console.error("Error saving address:", error);
    return res
      .status(400)
      .json({ success: false, message: "Failed to save address" });
  }
};

export const changeDefaultAddress = async (req, res) => {
  try {
    // console.log(req.body);
    const { addressId } = req.body;
    await Address.updateMany({}, { $set: { isDefault: false } });
    await Address.findByIdAndUpdate(
      { _id: addressId },
      { $set: { isDefault: true } },
    );
    return res.status(201).redirect("/profile");
    // return res.render('profile');
  } catch (error) {
    console.log(error);
  }
};

export const editAddress = async (req, res) => {
  try {
    const { addressId, redirectTo } = req.body;
    const address = await Address.findOne({ _id: addressId });

    console.log("edit address: ", address);

    return res.render("edit-address", {
      address,
      redirectTo
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      "error message": error,
    });
  }
};

export const updateAddress = async (req, res) => {
  
try {
  const {
    redirectTo,
    addressId,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    stateOrProvince,
    postalCode,
    country,
  } = req.body;


  await Address.findByIdAndUpdate({_id: addressId}, {...req.body});

   
    
  return res.status(200).redirect(redirectTo);
} catch (error) {
  console.log(error);
  return res.status(500).json({
    "error message": error,
  })
  
}
  
};

export const deleteAddress = async (req, res) => {
  const { addressId } = req.body;

  try {
    await Address.findByIdAndDelete({_id: addressId });
    return res.redirect('/profile');
  } catch (error) {
    console.log(error);
    return res.render('profile', {
      errorMessage: "Cant Find Address"
    })
  }
} 
