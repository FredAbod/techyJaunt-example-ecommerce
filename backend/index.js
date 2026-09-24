const express = require('express');
const connectDB = require('./src/configs/db');
const morgan = require('morgan');

require('dotenv').config();

const app = express();
const userRoutes = require('./src/routes/user.routes');
const categoryRoutes = require('./src/routes/category.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/cart.routes');


const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('dev'));

connectDB();
     
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});