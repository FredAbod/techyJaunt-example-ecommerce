const Product = require("../models/product.models");
const Cart = require("../models/cart.models");
const {
  isConfigured,
  signUpload,
  destroyAsset,
  assertOwnedImage,
} = require("../helpers/cloudinary");

const toPublicProduct = (product) => ({
  id: product._id,
  name: product.name,
  description: product.description,
  price: product.price,
  stock: product.stock,
  category: product.category,
  image: product.imageUrl
    ? { url: product.imageUrl, publicId: product.imagePublicId }
    : null,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const listProducts = async (req, res) => {
  const { page, limit, category } = req.query;

  try {
    const filter = {};
    if (category !== undefined) {
      filter.category = category;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products: products.map(toPublicProduct),
      page,
      limit,
      total,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ message: "Product created", product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, req.body);
    await product.save();
    return res.status(200).json({ message: "Product updated", product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Cart.updateMany(
      { "items.product": product._id },
      { $pull: { items: { product: product._id } } },
    );
    await product.deleteOne();

    if (product.imagePublicId) {
      try {
        await destroyAsset(product.imagePublicId);
      } catch (error) {
        console.log(error);
      }
    }

    return res.status(200).json({ message: "Product deleted" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const signProductImage = async (req, res) => {
  if (!isConfigured()) {
    return res.status(500).json({ message: "Image upload is not configured" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(signUpload(`products/${product._id}`));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const confirmProductImage = async (req, res) => {
  if (!isConfigured()) {
    return res.status(500).json({ message: "Image upload is not configured" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const result = await assertOwnedImage(req.body.publicId, `products/${product._id}`);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const previous = product.imagePublicId;
    product.imageUrl = result.image.url;
    product.imagePublicId = result.image.publicId;
    await product.save();

    if (previous && previous !== result.image.publicId) {
      try {
        await destroyAsset(previous);
      } catch (error) {
        console.log(error);
      }
    }

    return res
      .status(200)
      .json({ message: "Product image updated", product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  signProductImage,
  confirmProductImage,
};
