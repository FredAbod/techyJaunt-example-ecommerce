const express = require('express');
const connectDB = require('./src/configs/db');
const morgan = require('morgan');

require('dotenv').config();

const app = express();
const userRoutes = require('./src/routes/user.routes');


const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('dev'));

connectDB();
     
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.use('/api/v1/user', userRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});