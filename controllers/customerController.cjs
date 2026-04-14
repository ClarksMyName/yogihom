const Customer = require("../models/customerModel.cjs");

// Search customers by first or last name
exports.search = async (req, res) => {
  try {
    const searchString = req.query.search || "";

    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: searchString, $options: "i" } },
        { lastName: { $regex: searchString, $options: "i" } }
      ]
    });

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customer found" });
    }

    res.json(customers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ customerId: 1 });
    res.json(customers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one customer by customerId
exports.getCustomer = async (req, res) => {
  try {
    const customerId = req.query.customerId;
    const customerDetail = await Customer.findOne({ customerId });

    if (!customerDetail) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customerDetail);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Add a new customer
exports.add = async (req, res) => {
  try {
    const {
      customerId,
      firstName,
      lastName,
      email,
      phone,
      senior,
      address,
      preferredContact,
      classBalance
    } = req.body;

    if (!customerId || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingCustomer = await Customer.findOne({ customerId });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer ID already exists" });
    }

    const newCustomer = new Customer({
      customerId,
      firstName,
      lastName,
      email,
      phone,
      senior: senior === true || senior === "true",
      address: address || "",
      preferredContact: preferredContact || "email",
      classBalance: classBalance ?? 0
    });

    await newCustomer.save();

    res.status(201).json({
      message: "Customer added successfully",
      customer: newCustomer
    });
  } catch (err) {
    console.error("Error adding customer:", err.message);
    res.status(500).json({
      message: "Failed to add customer",
      error: err.message
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const {
      customerId,
      firstName,
      lastName,
      email,
      phone,
      senior,
      address,
      preferredContact,
      classBalance
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { customerId },
      {
        firstName,
        lastName,
        email,
        phone,
        senior: senior === true || senior === "true",
        address,
        preferredContact,
        classBalance
      },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Customer updated successfully",
      customer: updatedCustomer
    });
  } catch (err) {
    console.error("Error updating customer:", err.message);
    res.status(500).json({
      message: "Failed to update customer",
      error: err.message
    });
  }
};

// Populate customerId dropdown
exports.getCustomerIds = async (req, res) => {
  try {
    const customers = await Customer.find(
      {},
      { customerId: 1, firstName: 1, lastName: 1, _id: 0 }
    ).sort({ customerId: 1 });

    res.json(customers);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Generate next customer ID
exports.getNextId = async (req, res) => {
  try {
    const lastCustomer = await Customer.find({})
      .sort({ customerId: -1 })
      .limit(1);

    let maxNumber = 1;

    if (lastCustomer.length > 0) {
      const lastId = lastCustomer[0].customerId;
      const match = lastId.match(/\d+$/);

      if (match) {
        maxNumber = parseInt(match[0], 10) + 1;
      }
    }

    const nextId = `C${String(maxNumber).padStart(3, "0")}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.query;

    const result = await Customer.findOneAndDelete({ customerId });

    if (!result) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted", customerId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};