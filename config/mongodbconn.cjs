const mongoose = require("mongoose");

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yogidb";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

module.exports = mongoose;