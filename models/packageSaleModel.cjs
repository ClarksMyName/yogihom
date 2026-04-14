const mongoose = require("mongoose");

const packageSaleSchema = new mongoose.Schema(
  {
    saleId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      required: true
    },
    packageId: {
      type: String,
      required: true
    },
    purchaseDate: {
      type: String,
      required: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    amountPaid: {
      type: Number,
      required: true
    }
  },
  { collection: "sale" }
);

module.exports = mongoose.model("PackageSale", packageSaleSchema);