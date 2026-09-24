const cloudinary = require("cloudinary").v2;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const configure = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const signUpload = (folder) => {
  configure();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET,
  );

  return {
    timestamp,
    signature,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
};

const destroyAsset = async (publicId) => {
  configure();
  await cloudinary.uploader.destroy(publicId);
};

const assertOwnedImage = async (publicId, folder) => {
  if (
    typeof publicId !== "string" ||
    publicId.length === 0 ||
    publicId.length > 200 ||
    publicId.includes("..") ||
    !publicId.startsWith(`${folder}/`)
  ) {
    return { error: "Invalid publicId" };
  }

  configure();

  let asset;
  try {
    asset = await cloudinary.api.resource(publicId);
  } catch (error) {
    const status = error?.http_code || error?.error?.http_code;
    if (status === 404) {
      return { error: "Image not found" };
    }
    throw error;
  }

  if (
    asset.resource_type !== "image" ||
    !ALLOWED_FORMATS.includes(asset.format)
  ) {
    await destroyAsset(publicId);
    return { error: "Unsupported image type" };
  }

  if (asset.bytes > MAX_IMAGE_BYTES) {
    await destroyAsset(publicId);
    return { error: "Image must be 2MB or smaller" };
  }

  return {
    image: {
      url: asset.secure_url,
      publicId: asset.public_id,
    },
  };
};

module.exports = {
  isConfigured,
  signUpload,
  destroyAsset,
  assertOwnedImage,
};
