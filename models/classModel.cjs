const mongoose = require("mongoose");

const classTimeSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const classSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
      unique: true
    },
    className: {
      type: String,
      required: true
    },
    instructorId: {
      type: String,
      required: true
    },
    classType: {
      type: String,
      default: "General"
    },
    description: {
      type: String,
      default: ""
    },
    daytime: {
      type: [classTimeSchema],
      default: []
    }
  },
  { collection: "class" }
);

module.exports = mongoose.model("YogaClass", classSchema);