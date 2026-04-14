const PackageSale = require("../models/packageSaleModel.cjs");
const Customer = require("../models/customerModel.cjs");
const Package = require("../models/packageModel.cjs");

// Search sales by customerId or packageId
exports.search = async (req, res) => {
  try {
    const searchString = req.query.search || "";

    const sales = await PackageSale.find({
      $or: [
        { customerId: { $regex: searchString, $options: "i" } },
        { packageId: { $regex: searchString, $options: "i" } },
        { saleId: { $regex: searchString, $options: "i" } }
      ]
    }).sort({ saleId: 1 });

    if (!sales || sales.length === 0) {
      return res.status(404).json({ message: "No sales found" });
    }

    res.json(sales);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await PackageSale.find({}).sort({ saleId: 1 });
    res.json(sales);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one sale by saleId
exports.getSale = async (req, res) => {
  try {
    const saleId = req.query.saleId;
    const sale = await PackageSale.findOne({ saleId });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next sale ID
exports.getNextId = async (req, res) => {
  try {
    const sales = await PackageSale.find({
      saleId: { $regex: "^S\\d+$" }
    }).sort({ saleId: 1 });

    let maxNumber = 0;

    for (const sale of sales) {
      const match = sale.saleId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextId = `S${String(maxNumber + 1).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new sale
exports.add = async (req, res) => {
  try {
    const {
      saleId,
      customerId,
      packageId,
      purchaseDate,
      startDate,
      endDate,
      amountPaid
    } = req.body;

    if (!saleId || !customerId || !packageId || !purchaseDate || !startDate || !endDate || amountPaid == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingSale = await PackageSale.findOne({ saleId });
    if (existingSale) {
      return res.status(400).json({ message: "Sale ID already exists" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const pkg = await Package.findOne({ packageId });
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    const newSale = new PackageSale({
      saleId,
      customerId,
      packageId,
      purchaseDate,
      startDate,
      endDate,
      amountPaid: Number(amountPaid)
    });

    await newSale.save();

    customer.classBalance = Number(customer.classBalance || 0) + Number(pkg.classAmount || 0);
    await customer.save();

    res.status(201).json({
      message: "Sale recorded successfully",
      sale: newSale,
      updatedClassBalance: customer.classBalance
    });
  } catch (err) {
    console.error("Error adding sale:", err.message);
    res.status(500).json({
      message: "Failed to record sale",
      error: err.message
    });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const {
      saleId,
      customerId,
      packageId,
      purchaseDate,
      startDate,
      endDate,
      amountPaid
    } = req.body;

    if (!saleId) {
      return res.status(400).json({ message: "saleId is required" });
    }

    const updatedSale = await PackageSale.findOneAndUpdate(
      { saleId },
      {
        customerId,
        packageId,
        purchaseDate,
        startDate,
        endDate,
        amountPaid: amountPaid == null ? undefined : Number(amountPaid)
      },
      { new: true, runValidators: true }
    );

    if (!updatedSale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({
      message: "Sale updated successfully",
      sale: updatedSale
    });
  } catch (err) {
    console.error("Error updating sale:", err.message);
    res.status(500).json({
      message: "Failed to update sale",
      error: err.message
    });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { saleId } = req.query;

    const sale = await PackageSale.findOneAndDelete({ saleId });
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const customer = await Customer.findOne({ customerId: sale.customerId });
    const pkg = await Package.findOne({ packageId: sale.packageId });

    if (customer && pkg) {
      customer.classBalance = Number(customer.classBalance || 0) - Number(pkg.classAmount || 0);
      await customer.save();
    }

    res.json({
      message: "Sale deleted",
      saleId,
      updatedClassBalance: customer ? customer.classBalance : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};