const Cart = require("../models/cart.models");
const Product = require("../models/product.models");
const { isObjectId, isPositiveInteger } = require("../helpers/validate");

const toCartProduct = (product) => ({
  id: product._id,
  name: product.name,
  price: product.price,
  stock: product.stock,
  category: product.category,
  image: product.imageUrl
    ? { url: product.imageUrl, publicId: product.imagePublicId }
    : null,
});

const formatCart = (cart) => ({
  id: cart?._id || null,
  items: (cart?.items || [])
    .filter((item) => item.product && item.product._id)
    .map((item) => ({
      product: toCartProduct(item.product),
      quantity: item.quantity,
    })),
});

const loadCart = (userId) =>
  Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price stock category imageUrl imagePublicId",
  );

const getCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user._id);
    return res.status(200).json({ cart: formatCart(cart) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addItem = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!isObjectId(productId) || !isPositiveInteger(quantity)) {
    return res.status(400).json({ message: "Invalid cart item" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existing = cart.items.find((item) => String(item.product) === String(product._id));
    const nextQuantity = existing ? existing.quantity + quantity : quantity;
    if (nextQuantity > product.stock) {
      return res.status(400).json({ message: "Quantity exceeds stock" });
    }

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ product: product._id, quantity });
    }

    await cart.save();
    const populated = await loadCart(req.user._id);
    return res.status(200).json({ cart: formatCart(populated) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateItem = async (req, res) => {
  if (!isObjectId(req.params.productId) || !isPositiveInteger(req.body.quantity)) {
    return res.status(400).json({ message: "Invalid cart item" });
  }

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (req.body.quantity > product.stock) {
      return res.status(400).json({ message: "Quantity exceeds stock" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const existing = cart.items.find((item) => String(item.product) === String(product._id));
    if (!existing) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    existing.quantity = req.body.quantity;
    await cart.save();
    const populated = await loadCart(req.user._id);
    return res.status(200).json({ cart: formatCart(populated) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const removeItem = async (req, res) => {
  if (!isObjectId(req.params.productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter((item) => String(item.product) !== req.params.productId);
    if (cart.items.length === before) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await cart.save();
    const populated = await loadCart(req.user._id);
    return res.status(200).json({ cart: formatCart(populated) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem };
