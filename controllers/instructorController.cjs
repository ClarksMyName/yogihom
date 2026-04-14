const Instructor = require("../models/instructorModel.cjs");

// Search instructor by ID, first name, last name, userId, or username
exports.search = async (req, res) => {
  try {
    const searchString = (req.query.search || "").trim();

    if (!searchString) {
      return res.status(400).json({ message: "Search value is required" });
    }

    const instructors = await Instructor.find({
      $or: [
        { instructorId: { $regex: searchString, $options: "i" } },
        { firstName: { $regex: searchString, $options: "i" } },
        { lastName: { $regex: searchString, $options: "i" } },
        { username: { $regex: searchString, $options: "i" } },
        { userId: { $regex: searchString, $options: "i" } }
      ]
    }).sort({ instructorId: 1 });

    if (!instructors || instructors.length === 0) {
      return res.status(404).json({ message: "No instructor found" });
    }

    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all instructors
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find({}).sort({ instructorId: 1 });
    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one instructor by instructorId
exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    const instructorDetail = await Instructor.findOne({ instructorId });

    if (!instructorDetail) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.json(instructorDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Add a new instructor
exports.add = async (req, res) => {
  try {
    const {
      instructorId,
      userId,
      username,
      firstName,
      lastName,
      email,
      phone,
      address,
      preferredContact
    } = req.body;

    if (!instructorId || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingInstructor = await Instructor.findOne({ instructorId });
    if (existingInstructor) {
      return res.status(400).json({ message: "Instructor ID already exists" });
    }

    const newInstructor = new Instructor({
      instructorId,
      userId: userId || "",
      username: username || "",
      firstName,
      lastName,
      email,
      phone,
      address: address || "",
      preferredContact: preferredContact || "email"
    });

    await newInstructor.save();

    res.status(201).json({
      message: "Instructor added successfully",
      instructor: newInstructor
    });
  } catch (err) {
    console.error("Error adding instructor:", err.message);
    res.status(500).json({
      message: "Failed to add instructor",
      error: err.message
    });
  }
};

// Update instructor
exports.updateInstructor = async (req, res) => {
  try {
    const {
      instructorId,
      userId,
      username,
      firstName,
      lastName,
      email,
      phone,
      address,
      preferredContact
    } = req.body;

    if (!instructorId) {
      return res.status(400).json({ message: "instructorId is required" });
    }

    const updatedInstructor = await Instructor.findOneAndUpdate(
      { instructorId },
      {
        userId,
        username,
        firstName,
        lastName,
        email,
        phone,
        address,
        preferredContact
      },
      { new: true, runValidators: true }
    );

    if (!updatedInstructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.json({
      message: "Instructor updated successfully",
      instructor: updatedInstructor
    });
  } catch (err) {
    console.error("Error updating instructor:", err.message);
    res.status(500).json({
      message: "Failed to update instructor",
      error: err.message
    });
  }
};

// Get instructor IDs for dropdowns
exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find(
      {},
      { instructorId: 1, firstName: 1, lastName: 1, _id: 0 }
    ).sort({ instructorId: 1 });

    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next instructor ID
exports.getNextId = async (req, res) => {
  try {
    const lastInstructor = await Instructor.find({})
      .sort({ instructorId: -1 })
      .limit(1);

    let maxNumber = 1;

    if (lastInstructor.length > 0) {
      const lastId = lastInstructor[0].instructorId;
      const match = lastId.match(/\d+$/);

      if (match) {
        maxNumber = parseInt(match[0], 10) + 1;
      }
    }

    const nextId = `I${String(maxNumber).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete instructor
exports.deleteInstructor = async (req, res) => {
  try {
    const { instructorId } = req.query;

    const result = await Instructor.findOneAndDelete({ instructorId });

    if (!result) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    res.json({ message: "Instructor deleted", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};