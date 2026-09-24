const toPublicUser = (user) => {
  const picture = user.profilePictureUrl
    ? {
        url: user.profilePictureUrl,
        publicId: user.profilePicturePublicId,
      }
    : null;

  const address = user.address
    ? {
        line1: user.address.line1 || "",
        city: user.address.city || "",
        state: user.address.state || "",
        country: user.address.country || "",
        postalCode: user.address.postalCode || "",
      }
    : null;

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    address,
    profilePicture: picture,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = toPublicUser;
