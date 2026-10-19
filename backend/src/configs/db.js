const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGODB_URL;


const connectDB = async () => {
    try {
        await mongoose.connect(url);
        console.log('Connected to MongoDB successfully');
        try {
            const hello = await mongoose.connection.db.admin().command({ hello: 1 });
            if (!hello.setName) {
                console.warn('MongoDB is not a replica set. Wallet payments need one so money moves can commit all at once or not at all.');
            }
        } catch (checkError) {
            console.warn('Could not check whether MongoDB is a replica set.');
        }
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

module.exports = connectDB;