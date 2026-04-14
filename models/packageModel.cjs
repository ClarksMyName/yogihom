const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    packageId: {
      type: String,
      required: true,
      unique: true
    },
    packageName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    classAmount: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  { collection: "package" }
);

module.exports = mongoose.model("Package", packageSchema);