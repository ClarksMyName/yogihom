const YogaClass = require("../models/classModel.cjs");

// Search classes by class name
exports.search = async (req, res) => {
  try {
    const searchString = req.query.className || "";

    const classes = await YogaClass.find({
      className: { $regex: searchString, $options: "i" }
    });

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "No class found" });
    }

    res.json(classes);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await YogaClass.find({}).sort({ classId: 1 });
    res.json(classes);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one class by classId
exports.getClass = async (req, res) => {
  try {
    const classId = req.query.classId;
    const classDetail = await YogaClass.findOne({ classId });

    if (!classDetail) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Add a new class
exports.add = async (req, res) => {
  try {
    const {
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    } = req.body;

    if (!classId || !className || !instructorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingClass = await YogaClass.findOne({ classId });
    if (existingClass) {
      return res.status(400).json({ message: "Class ID already exists" });
    }

    const newClass = new YogaClass({
      classId,
      className,
      instructorId,
      classType: classType || "General",
      description: description || "",
      daytime: Array.isArray(daytime) ? daytime : []
    });

    await newClass.save();

    res.status(201).json({
      message: "Class added successfully",
      class: newClass
    });
  } catch (err) {
    console.error("Error adding class:", err.message);
    res.status(500).json({
      message: "Failed to add class",
      error: err.message
    });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const {
      classId,
      className,
      instructorId,
      classType,
      description,
      daytime
    } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const updatedClass = await YogaClass.findOneAndUpdate(
      { classId },
      {
        className,
        instructorId,
        classType,
        description,
        daytime: Array.isArray(daytime) ? daytime : []
      },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json({
      message: "Class updated successfully",
      class: updatedClass
    });
  } catch (err) {
    console.error("Error updating class:", err.message);
    res.status(500).json({
      message: "Failed to update class",
      error: err.message
    });
  }
};

// Populate classId dropdown
exports.getClassIds = async (req, res) => {
  try {
    const classes = await YogaClass.find(
      {},
      { classId: 1, className: 1, _id: 0 }
    ).sort({ classId: 1 });

    res.json(classes);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next class ID
exports.getNextId = async (req, res) => {
  try {
    const lastClass = await YogaClass.find({})
      .sort({ classId: -1 })
      .limit(1);

    let maxNumber = 1;

    if (lastClass.length > 0) {
      const lastId = lastClass[0].classId;
      const match = lastId.match(/\d+$/);

      if (match) {
        maxNumber = parseInt(match[0], 10) + 1;
      }
    }

    const nextId = `A${String(maxNumber).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.query;

    const result = await YogaClass.findOneAndDelete({ classId });

    if (!result) {
      return res.status(404).json({ error: "Class not found" });
    }

    res.json({ message: "Class deleted", classId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};