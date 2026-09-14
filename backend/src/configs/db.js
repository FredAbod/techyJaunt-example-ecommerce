const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGODB_URL;


const connectDB = async () => {
    try {
        await mongoose.connect(url);
        console.log('Connected to MongoDB successfully');
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

module.exports = connectDB;