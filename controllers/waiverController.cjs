const Waiver = require("../models/waiverModel.cjs");
const Customer = require("../models/customerModel.cjs");

// Search waivers by waiverId or customerId
exports.search = async (req, res) => {
  try {
    const searchString = (req.query.search || "").trim();

    if (!searchString) {
      return res.status(400).json({ message: "Search value is required" });
    }

    const waivers = await Waiver.find({
      $or: [
        { waiverId: { $regex: searchString, $options: "i" } },
        { customerId: { $regex: searchString, $options: "i" } }
      ]
    }).sort({ waiverId: 1 });

    if (!waivers || waivers.length === 0) {
      return res.status(404).json({ message: "No waiver found" });
    }

    res.json(waivers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all waivers
exports.getAllWaivers = async (req, res) => {
  try {
    const waivers = await Waiver.find({}).sort({ waiverId: 1 });
    res.json(waivers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one waiver by waiverId
exports.getWaiver = async (req, res) => {
  try {
    const waiverId = req.query.waiverId;
    const waiver = await Waiver.findOne({ waiverId });

    if (!waiver) {
      return res.status(404).json({ message: "Waiver not found" });
    }

    res.json(waiver);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next waiver ID
exports.getNextId = async (req, res) => {
  try {
    const waivers = await Waiver.find({
      waiverId: { $regex: "^W\\d+$" }
    }).sort({ waiverId: 1 });

    let maxNumber = 0;

    for (const waiver of waivers) {
      const match = waiver.waiverId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextId = `W${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new waiver
exports.add = async (req, res) => {
  try {
    const { waiverId, customerId, signedDate, accepted } = req.body;

    if (!waiverId || !customerId || !signedDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingWaiver = await Waiver.findOne({ waiverId });
    if (existingWaiver) {
      return res.status(400).json({ message: "Waiver ID already exists" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const newWaiver = new Waiver({
      waiverId,
      customerId,
      signedDate,
      accepted: accepted === true || accepted === "true"
    });

    await newWaiver.save();

    res.status(201).json({
      message: "Waiver saved successfully",
      waiver: newWaiver
    });
  } catch (err) {
    console.error("Error adding waiver:", err.message);
    res.status(500).json({
      message: "Failed to save waiver",
      error: err.message
    });
  }
};

// Update waiver
exports.updateWaiver = async (req, res) => {
  try {
    const { waiverId, customerId, signedDate, accepted } = req.body;

    if (!waiverId) {
      return res.status(400).json({ message: "waiverId is required" });
    }

    const updatedWaiver = await Waiver.findOneAndUpdate(
      { waiverId },
      {
        customerId,
        signedDate,
        accepted: accepted === true || accepted === "true"
      },
      { new: true, runValidators: true }
    );

    if (!updatedWaiver) {
      return res.status(404).json({ message: "Waiver not found" });
    }

    res.json({
      message: "Waiver updated successfully",
      waiver: updatedWaiver
    });
  } catch (err) {
    console.error("Error updating waiver:", err.message);
    res.status(500).json({
      message: "Failed to update waiver",
      error: err.message
    });
  }
};

// Delete waiver
exports.deleteWaiver = async (req, res) => {
  try {
    const { waiverId } = req.query;

    const result = await Waiver.findOneAndDelete({ waiverId });

    if (!result) {
      return res.status(404).json({ error: "Waiver not found" });
    }

    res.json({ message: "Waiver deleted", waiverId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};