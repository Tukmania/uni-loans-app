// config/db.js
const mongoose = require('mongoose');
// Communicating with MongoDB, import the Mongoose library.
const connectDB = async () => {

// Establishing the async function to create a connection with MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
// Optimizing server selection and connection management

    console.log('MongoDB connected successfully');
// Displaying a message if the connection is successful
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
// Displaying an error message if the connection is unsuccessful
    process.exit(1);
  }
};
module.exports = connectDB;





