const Product = require("../models/product.models");
const Cart = require("../models/cart.models");
const CATEGORIES = require("../constants/categories");
const { isObjectId, isNonNegativeInteger } = require("../helpers/validate");
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

const pickProductFields = (body, partial) => {
  const { name, description, price, stock, category } = body;
  const updates = {};

  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
      return { error: "Invalid name" };
    }
    updates.name = name.trim();
  }

  if (!partial || description !== undefined) {
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 2000
    ) {
      return { error: "Invalid description" };
    }
    updates.description = description.trim();
  }

  if (!partial || price !== undefined) {
    if (!isNonNegativeInteger(price)) {
      return { error: "Invalid price" };
    }
    updates.price = price;
  }

  if (!partial || stock !== undefined) {
    if (!isNonNegativeInteger(stock)) {
      return { error: "Invalid stock" };
    }
    updates.stock = stock;
  }

  if (!partial || category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      return { error: "Invalid category" };
    }
    updates.category = category;
  }

  if (partial && Object.keys(updates).length === 0) {
    return { error: "No valid fields to update" };
  }

  return { updates };
};

const listProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    if (!Number.isInteger(limit) || limit < 1) {
      limit = 20;
    }
    if (limit > 50) {
      limit = 50;
    }

    const filter = {};
    if (req.query.category !== undefined) {
      if (!CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = req.query.category;
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
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

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
  const picked = pickProductFields(req.body, false);
  if (picked.error) {
    return res.status(400).json({ message: picked.error });
  }

  try {
    const product = await Product.create(picked.updates);
    return res.status(201).json({ message: "Product created", product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProduct = async (req, res) => {
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const picked = pickProductFields(req.body, true);
  if (picked.error) {
    return res.status(400).json({ message: picked.error });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, picked.updates);
    await product.save();
    return res.status(200).json({ message: "Product updated", product: toPublicProduct(product) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

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
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
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
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
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
