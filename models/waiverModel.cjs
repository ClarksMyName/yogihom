const mongoose = require("mongoose");

const waiverSchema = new mongoose.Schema(
  {
    waiverId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      required: true
    },
    signedDate: {
      type: String,
      required: true
    },
    accepted: {
      type: Boolean,
      default: true
    }
  },
  { collection: "waiver" }
);

module.exports = mongoose.model("Waiver", waiverSchema);