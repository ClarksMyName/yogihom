const mongoose = require("mongoose");

const classRecordSchema = new mongoose.Schema(
  {
    checkinId: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: String,
      required: true
    },
    classId: {
      type: String,
      required: true
    },
    datetime: {
      type: String,
      required: true
    }
  },
  { collection: "attendance" }
);

module.exports = mongoose.model("ClassRecord", classRecordSchema);