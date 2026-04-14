const Package = require("../models/packageModel.cjs");

// Search packages by package name
exports.search = async (req, res) => {
  try {
    const searchString = req.query.packageName || "";

    const packages = await Package.find({
      packageName: { $regex: searchString, $options: "i" }
    });

    if (!packages || packages.length === 0) {
      return res.status(404).json({ message: "No package found" });
    }

    res.json(packages);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find({}).sort({ packageId: 1 });
    res.json(packages);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one package by packageId
exports.getPackage = async (req, res) => {
  try {
    const packageId = req.query.packageId;
    const packageDetail = await Package.findOne({ packageId });

    if (!packageDetail) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json(packageDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Add a new package
exports.add = async (req, res) => {
  try {
    const {
      packageId,
      packageName,
      description,
      classAmount,
      price
    } = req.body;

    if (!packageId || !packageName || classAmount == null || price == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingPackage = await Package.findOne({ packageId });
    if (existingPackage) {
      return res.status(400).json({ message: "Package ID already exists" });
    }

    const newPackage = new Package({
      packageId,
      packageName,
      description: description || "",
      classAmount: Number(classAmount),
      price: Number(price)
    });

    await newPackage.save();

    res.status(201).json({
      message: "Package added successfully",
      package: newPackage
    });
  } catch (err) {
    console.error("Error adding package:", err.message);
    res.status(500).json({
      message: "Failed to add package",
      error: err.message
    });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const {
      packageId,
      packageName,
      description,
      classAmount,
      price
    } = req.body;

    if (!packageId) {
      return res.status(400).json({ message: "packageId is required" });
    }

    const updatedPackage = await Package.findOneAndUpdate(
      { packageId },
      {
        packageName,
        description,
        classAmount: classAmount == null ? undefined : Number(classAmount),
        price: price == null ? undefined : Number(price)
      },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({
      message: "Package updated successfully",
      package: updatedPackage
    });
  } catch (err) {
    console.error("Error updating package:", err.message);
    res.status(500).json({
      message: "Failed to update package",
      error: err.message
    });
  }
};

// Populate packageId dropdown
exports.getPackageIds = async (req, res) => {
  try {
    const packages = await Package.find(
      {},
      { packageId: 1, packageName: 1, _id: 0 }
    ).sort({ packageId: 1 });

    res.json(packages);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next package ID
exports.getNextId = async (req, res) => {
  try {
    const type = (req.query.type || "regular").toLowerCase();

    let prefix;
    if (type === "senior") {
      prefix = "SP";
    } else {
      prefix = "P";
    }

    const packages = await Package.find({
      packageId: { $regex: `^${prefix}\\d+$` }
    }).sort({ packageId: 1 });

    let maxNumber = 0;

    for (const pkg of packages) {
      const match = pkg.packageId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextId = `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const { packageId } = req.query;

    const result = await Package.findOneAndDelete({ packageId });

    if (!result) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json({ message: "Package deleted", packageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};