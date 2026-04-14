const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true
    },
    firstName: {
      type: String,
      default: ""
    },
    lastName: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    senior: {
      type: Boolean,
      default: false
    },
    address: {
      type: String,
      default: ""
    },
    preferredContact: {
      type: String,
      default: "email"
    },
    classBalance: {
      type: Number,
      default: 0
    }
  },
  { collection: "customer" }
);

module.exports = mongoose.model("Customer", customerSchema);