const ClassRecord = require("../models/classRecordModel.cjs");
const Customer = require("../models/customerModel.cjs");
const YogaClass = require("../models/classModel.cjs");

// Get all class records
exports.getAllRecords = async (req, res) => {
  try {
    const records = await ClassRecord.find({}).sort({ checkinId: 1 });
    res.json(records);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one class record by checkinId
exports.getRecord = async (req, res) => {
  try {
    const checkinId = req.query.checkinId;
    const record = await ClassRecord.findOne({ checkinId });

    if (!record) {
      return res.status(404).json({ message: "Class record not found" });
    }

    res.json(record);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next class record ID
exports.getNextId = async (req, res) => {
  try {
    const records = await ClassRecord.find({
      checkinId: { $regex: "^CH\\d+$" }
    }).sort({ checkinId: 1 });

    let maxNumber = 0;

    for (const record of records) {
      const match = record.checkinId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextId = `CH${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new class record
exports.add = async (req, res) => {
  try {
    const { checkinId, customerId, classId, datetime } = req.body;

    if (!checkinId || !customerId || !classId || !datetime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingRecord = await ClassRecord.findOne({ checkinId });
    if (existingRecord) {
      return res.status(400).json({ message: "Check-in ID already exists" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const yogaClass = await YogaClass.findOne({ classId });
    if (!yogaClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const newRecord = new ClassRecord({
      checkinId,
      customerId,
      classId,
      datetime
    });

    await newRecord.save();

    customer.classBalance = Number(customer.classBalance || 0) - 1;
    await customer.save();

    res.status(201).json({
      message: "Class record added successfully",
      record: newRecord,
      updatedClassBalance: customer.classBalance
    });
  } catch (err) {
    console.error("Error adding class record:", err.message);
    res.status(500).json({
      message: "Failed to add class record",
      error: err.message
    });
  }
};

// Update class record
exports.updateRecord = async (req, res) => {
  try {
    const { checkinId, customerId, classId, datetime } = req.body;

    if (!checkinId) {
      return res.status(400).json({ message: "checkinId is required" });
    }

    const updatedRecord = await ClassRecord.findOneAndUpdate(
      { checkinId },
      {
        customerId,
        classId,
        datetime
      },
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Class record not found" });
    }

    res.json({
      message: "Class record updated successfully",
      record: updatedRecord
    });
  } catch (err) {
    console.error("Error updating class record:", err.message);
    res.status(500).json({
      message: "Failed to update class record",
      error: err.message
    });
  }
};

// Delete class record
exports.deleteRecord = async (req, res) => {
  try {
    const { checkinId } = req.query;

    const record = await ClassRecord.findOneAndDelete({ checkinId });

    if (!record) {
      return res.status(404).json({ error: "Class record not found" });
    }

    const customer = await Customer.findOne({ customerId: record.customerId });
    if (customer) {
      customer.classBalance = Number(customer.classBalance || 0) + 1;
      await customer.save();
    }

    res.json({
      message: "Class record deleted",
      checkinId,
      updatedClassBalance: customer ? customer.classBalance : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};