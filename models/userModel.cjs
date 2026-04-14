const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: ""
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "staff", "member"],
      default: "member"
    },
    customerId: {
      type: String,
      default: ""
    }
  },
  { collection: "user" }
);

module.exports = mongoose.model("User", userSchema);