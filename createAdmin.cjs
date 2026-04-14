const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/userModel.cjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yogidb";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const username = "Admin";
    const plainPassword = "admin123";

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("⚠️ Admin username already exists");
      return;
    }

    const adminUsers = await User.find({
      userId: { $regex: "^AD\\d+$" }
    }).sort({ userId: 1 });

    let maxNumber = 0;

    for (const user of adminUsers) {
      const match = user.userId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextAdminId = `AD${String(maxNumber + 1).padStart(3, "0")}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const adminUser = new User({
      userId: nextAdminId,
      username,
      passwordHash,
      role: "admin",
      customerId: ""
    });

    await adminUser.save();

    console.log("✅ Admin account created successfully");
    console.log(`Admin ID: ${nextAdminId}`);
    console.log("Username: Admin");
    console.log("Password: admin123");
  } catch (err) {
    console.error("❌ Error creating admin account:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createAdmin();