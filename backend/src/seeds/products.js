const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/product.models");

const products = [
  {
    name: "Nova X1 Phone",
    description: "6.5 inch display, 128GB storage, dual camera.",
    price: 89999,
    stock: 24,
    category: "phones",
  },
  {
    name: "Nova X1 Pro",
    description: "6.7 inch display, 256GB storage, 5G.",
    price: 119999,
    stock: 12,
    category: "phones",
  },
  {
    name: "Pulse Mini Phone",
    description: "Compact phone with a two-day battery.",
    price: 44999,
    stock: 40,
    category: "phones",
  },
  {
    name: "Pulse Fold",
    description: "Foldable screen with a cover display.",
    price: 189999,
    stock: 6,
    category: "phones",
  },
  {
    name: "LumenBook 14",
    description: "14 inch laptop, 16GB memory, 512GB SSD.",
    price: 149999,
    stock: 15,
    category: "computers",
  },
  {
    name: "LumenBook 16",
    description: "16 inch laptop for design and development.",
    price: 199999,
    stock: 8,
    category: "computers",
  },
  {
    name: "DeskMini Tower",
    description: "Small desktop with room for an extra drive.",
    price: 109999,
    stock: 10,
    category: "computers",
  },
  {
    name: "PixelView 27 Monitor",
    description: "27 inch 144Hz monitor with USB-C.",
    price: 59999,
    stock: 18,
    category: "computers",
  },
  {
    name: "Aero Buds",
    description: "Wireless earbuds with a charging case.",
    price: 14999,
    stock: 60,
    category: "audio",
  },
  {
    name: "Aero Buds Pro",
    description: "Noise cancelling earbuds with wireless charging.",
    price: 24999,
    stock: 35,
    category: "audio",
  },
  {
    name: "Harbor Speaker",
    description: "Portable Bluetooth speaker, water resistant.",
    price: 19999,
    stock: 28,
    category: "audio",
  },
  {
    name: "Studio Headphones",
    description: "Over-ear headphones for music and calls.",
    price: 32999,
    stock: 22,
    category: "audio",
  },
  {
    name: "Arcade Pad",
    description: "Wireless controller for PC and console.",
    price: 9999,
    stock: 50,
    category: "gaming",
  },
  {
    name: "Arcade Headset",
    description: "Gaming headset with a flip microphone.",
    price: 17999,
    stock: 30,
    category: "gaming",
  },
  {
    name: "Keylight Keyboard",
    description: "Mechanical keyboard with white backlight.",
    price: 15999,
    stock: 26,
    category: "gaming",
  },
  {
    name: "Swift Mouse",
    description: "Lightweight wireless mouse, 6 buttons.",
    price: 7999,
    stock: 45,
    category: "gaming",
  },
  {
    name: "Charge Brick 30W",
    description: "USB-C wall charger for phones and laptops.",
    price: 4999,
    stock: 80,
    category: "accessories",
  },
  {
    name: "Braided USB-C Cable",
    description: "2 meter USB-C cable with a nylon braid.",
    price: 1999,
    stock: 120,
    category: "accessories",
  },
  {
    name: "Clear Phone Case",
    description: "Shock-absorbing clear case.",
    price: 2499,
    stock: 90,
    category: "accessories",
  },
  {
    name: "Laptop Sleeve 14",
    description: "Padded sleeve for a 14 inch laptop.",
    price: 3999,
    stock: 40,
    category: "accessories",
  },
];

const seedProducts = async () => {
  await mongoose.connect(process.env.MONGODB_URL);

  for (const product of products) {
    await Product.updateOne({ name: product.name }, { $setOnInsert: product }, { upsert: true });
  }

  const count = await Product.countDocuments({ name: { $in: products.map((item) => item.name) } });
  console.log(`Seeded products present: ${count}`);
  await mongoose.disconnect();
};

seedProducts().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
