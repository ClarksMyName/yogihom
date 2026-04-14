const User = require("../models/userModel.cjs");
const Customer = require("../models/customerModel.cjs");

// Search users by username, role, userId, or customerId
exports.search = async (req, res) => {
  try {
    const searchString = (req.query.search || "").trim();

    if (!searchString) {
      return res.status(400).json({ message: "Search value is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: searchString, $options: "i" } },
        { role: { $regex: searchString, $options: "i" } },
        { userId: { $regex: searchString, $options: "i" } },
        { customerId: { $regex: searchString, $options: "i" } }
      ]
    }).sort({ username: 1 });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No user found" });
    }

    res.json(users);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ username: 1 });
    res.json(users);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Get one user by username
exports.getUser = async (req, res) => {
  try {
    const username = req.query.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

async function getNextStaffId() {
  const staffUsers = await User.find({
    userId: { $regex: "^ST\\d+$" }
  }).sort({ userId: 1 });

  let maxNumber = 0;

  for (const user of staffUsers) {
    const match = (user.userId || "").match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `ST${String(maxNumber + 1).padStart(3, "0")}`;
}

async function getNextAdminId() {
  const adminUsers = await User.find({
    userId: { $regex: "^AD\\d+$" }
  }).sort({ userId: 1 });

  let maxNumber = 0;

  for (const user of adminUsers) {
    const match = (user.userId || "").match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `AD${String(maxNumber + 1).padStart(3, "0")}`;
}

async function getNextCustomerId() {
  const customers = await Customer.find({
    customerId: { $regex: "^C\\d+$" }
  }).sort({ customerId: 1 });

  let maxNumber = 0;

  for (const customer of customers) {
    const match = (customer.customerId || "").match(/\d+$/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `C${String(maxNumber + 1).padStart(3, "0")}`;
}

// Update user role / IDs
exports.updateUserRole = async (req, res) => {
  try {
    const { username, role } = req.body;

    if (!username || !role) {
      return res.status(400).json({ message: "username and role are required" });
    }

    if (!["admin", "staff", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Promote to staff
    if (role === "staff") {
      if (!user.userId || !user.userId.startsWith("ST")) {
        user.userId = await getNextStaffId();
      }

      if (!user.customerId) {
        const nextCustomerId = await getNextCustomerId();
        user.customerId = nextCustomerId;

        const existingCustomer = await Customer.findOne({ customerId: nextCustomerId });
        if (!existingCustomer) {
          await Customer.create({
            customerId: nextCustomerId,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            senior: false,
            address: "",
            preferredContact: "email",
            classBalance: 0
          });
        }
      }
    }

    // Promote to admin
    if (role === "admin") {
      if (!user.userId || !user.userId.startsWith("AD")) {
        user.userId = await getNextAdminId();
      }
      // keep existing customerId if they already have one
    }

    // Back to member
    if (role === "member") {
      if (!user.customerId) {
        const nextCustomerId = await getNextCustomerId();
        user.customerId = nextCustomerId;

        const existingCustomer = await Customer.findOne({ customerId: nextCustomerId });
        if (!existingCustomer) {
          await Customer.create({
            customerId: nextCustomerId,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            senior: false,
            address: "",
            preferredContact: "email",
            classBalance: 0
          });
        }
      }
      // keep userId for history; do not recycle IDs
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user
    });
  } catch (err) {
    console.error("Error updating user role:", err.message);
    res.status(500).json({
      message: "Failed to update user role",
      error: err.message
    });
  }
};