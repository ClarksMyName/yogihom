const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yogidb";

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = connectDB;