const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

// ---------- DATABASE ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yogidb";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ---------- MODEL IMPORTS ----------
let User, Customer, ClassRecord, YogaClass, Package, PackageSale;

try {
  User = require("./models/userModel.cjs");
} catch {}
try {
  Customer = require("./models/customerModel.cjs");
} catch {}
try {
  ClassRecord = require("./models/classRecordModel.cjs");
} catch {}
try {
  YogaClass = require("./models/classModel.cjs");
} catch {}
try {
  Package = require("./models/packageModel.cjs");
} catch {}


// ---------- MIDDLEWARE ----------
app.use(express.static("public"));
app.use("/data", express.static(path.join(__dirname, "public", "data")));
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "yogitrack-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

// ---------- AUTH HELPERS ----------
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/index.html");
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/index.html");
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).send("Access denied");
    }
    next();
  };
}

// ---------- CORE PAGE ROUTES ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- ROUTE MODULES ----------
app.use("/api/instructor", require("./routes/instructorRoutes.cjs"));
//console.log("instructor ok");

app.use("/api/class", require("./routes/classRoutes.cjs"));
//console.log("class ok");

app.use("/api/customer", require("./routes/customerRoutes.cjs"));
//console.log("customer ok");

app.use("/api/package", require("./routes/packageRoutes.cjs"));
//console.log("package ok");

app.use("/api/classRecord", require("./routes/classRecordRoutes.cjs"));
//console.log("classRecord ok");

app.use("/api/packageSale", require("./routes/packageSaleRoutes.cjs"));
//console.log("packageSale ok");

app.use("/api/waiver", require("./routes/waiverRoutes.cjs"));
//console.log("waiver ok");

app.use("/api/user", require("./routes/userRoutes.cjs"));
//console.log("user ok");

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  try {
    if (!User) {
      return res.redirect("/index.html?error=login_failed");
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect("/index.html?error=missing_fields");
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.redirect("/index.html?error=login_failed");
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.redirect("/index.html?error=login_failed");
    }

    req.session.user = {
      username: user.username,
      role: user.role,
      customerId: user.customerId || "",
      userId: user.userId || ""
    };

    if (user.role === "admin" || user.role === "staff") {
      return res.redirect("/htmls/all-in-one.html");
    }

    return res.redirect("/htmls/dashboard.html");
  } catch (err) {
    console.error("Login error:", err.message);
    return res.redirect("/index.html?error=login_failed");
  }
});

// ---------- REGISTER ----------
app.post("/register", async (req, res) => {
  try {
    if (!User || !Customer) {
      return res.redirect("/htmls/register.html?error=register_failed");
    }

    const {
      username,
      password,
      firstName,
      lastName,
      email,
      phone,
      address
    } = req.body;

    if (!username || !password || !firstName || !lastName || !email || !phone) {
      return res.redirect("/htmls/register.html?error=missing_fields");
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.redirect("/htmls/register.html?error=username_taken");
    }

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.redirect("/htmls/register.html?error=email_taken");
    }

    const customers = await Customer.find({
      customerId: { $regex: "^C\\d+$" }
    }).sort({ customerId: 1 });

    let maxNumber = 0;

    for (const customer of customers) {
      const match = customer.customerId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const customerId = `C${String(maxNumber + 1).padStart(3, "0")}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      userId: "",
      username,
      passwordHash,
      role: "member",
      customerId
    });

    await newUser.save();

    await Customer.create({
      customerId,
      firstName,
      lastName,
      email,
      phone,
      senior: false,
      address: address || "",
      preferredContact: "email",
      classBalance: 0
    });

    req.session.user = {
      username: newUser.username,
      role: newUser.role,
      customerId: newUser.customerId,
      userId: newUser.userId || ""
    };

    return res.redirect("/htmls/dashboard.html");
  } catch (err) {
    console.error("Register error:", err.message);
    return res.redirect("/htmls/register.html?error=register_failed");
  }
});

// ---------- LOGOUT ----------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/index.html");
  });
});

// ---------- USER INFO ----------
app.get("/api/user/me", requireLogin, async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ error: "User model not installed yet" });
    }

    const user = await User.findOne({ username: req.session.user.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      role: user.role,
      customerId: user.customerId || ""
    });
  } catch (err) {
    console.error("User info error:", err.message);
    res.status(500).json({ error: "Failed to load user info" });
  }
});

// Alias for newer frontend code
app.get("/api/me", requireLogin, async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ error: "User model not installed yet" });
    }

    const user = await User.findOne({ username: req.session.user.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      role: user.role,
      customerId: user.customerId || ""
    });
  } catch (err) {
    console.error("User info error:", err.message);
    res.status(500).json({ error: "Failed to load user info" });
  }
});

// ---------- PROFILE ----------
app.get("/api/profile/me", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!User || !Customer) {
      return res.status(500).json({ error: "User/Customer models not installed yet" });
    }

    const user = await User.findOne({ username: req.session.user.username });
    const customer = await Customer.findOne({ customerId: req.session.user.customerId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      customerId: customer?.customerId || "",
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      preferredContact: customer?.preferredContact || "email",
      classBalance: customer?.classBalance ?? 0
    });
  } catch (err) {
    console.error("Profile load error:", err.message);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

app.post("/api/profile/update", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!User || !Customer) {
      return res.status(500).json({ error: "User/Customer models not installed yet" });
    }

    const { firstName, lastName, email, phone, address, preferredContact, password } = req.body;

    const user = await User.findOne({ username: req.session.user.username });
    const customer = await Customer.findOne({ customerId: req.session.user.customerId });

    if (!user || !customer) {
      return res.status(404).json({ error: "Profile not found" });
    }

    customer.firstName = firstName || "";
    customer.lastName = lastName || "";
    customer.email = email || "";
    customer.phone = phone || "";
    customer.address = address || "";
    customer.preferredContact = preferredContact || customer.preferredContact || "email";
    await customer.save();

    if (password && password.trim() !== "") {
      user.passwordHash = await bcrypt.hash(password, 10);
      await user.save();
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ---------- ADMIN / STAFF RESET PASSWORD ----------
app.post("/api/admin/reset-password", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    if (!User) return res.status(500).json({ error: "User model not installed yet" });

    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ error: "Username and new password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ---------- CUSTOMERS / ROSTER ----------
app.get("/api/customers", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    if (!Customer) return res.status(500).json({ error: "Customer model not installed yet" });

    const customers = await Customer.find({}).sort({ customerId: 1 });
    res.json(customers);
  } catch (err) {
    console.error("Customers load error:", err.message);
    res.status(500).json({ error: "Failed to load customers" });
  }
});

app.get("/api/customers/me", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!Customer) return res.status(500).json({ error: "Customer model not installed yet" });

    const customer = await Customer.findOne({ customerId: req.session.user.customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    res.json(customer);
  } catch (err) {
    console.error("Customer profile error:", err.message);
    res.status(500).json({ error: "Failed to load customer profile" });
  }
});

app.get("/api/roster", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    if (!Customer) return res.status(500).json({ error: "Customer model not installed yet" });

    const customers = await Customer.find({}).sort({ customerId: 1 });
    res.json(customers);
  } catch (err) {
    console.error("Roster load error:", err.message);
    res.status(500).json({ error: "Failed to load roster" });
  }
});

// ---------- CLASSES ----------
app.get("/api/classes", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!YogaClass) return res.status(500).json({ error: "Class model not installed yet" });

    const classes = await YogaClass.find({}).sort({ classId: 1 });
    res.json(classes);
  } catch (err) {
    console.error("Classes load error:", err.message);
    res.status(500).json({ error: "Failed to load classes" });
  }
});

// ---------- CLASS RECORDS / CHECKINS ----------
/*
app.get("/api/checkins/my", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!ClassRecord) return res.status(500).json({ error: "Class record model not installed yet" });

    const checkins = await ClassRecord.find({
      customerId: req.session.user.customerId
    }).sort({ datetime: -1 });

    res.json(checkins);
  } catch (err) {
    console.error("Load check-ins error:", err.message);
    res.status(500).json({ error: "Failed to load check-ins" });
  }
});

app.post("/api/checkins/add", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!ClassRecord || !Customer || !YogaClass) {
      return res.status(500).json({ error: "ClassRecord/Customer/Class models not installed yet" });
    }

    const { customerId, classId, datetime } = req.body;

    if (!customerId || !classId || !datetime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (req.session.user.role === "member" && customerId !== req.session.user.customerId) {
      return res.status(403).json({ error: "Unauthorized customerId" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }

    const yogaClass = await YogaClass.findOne({ classId });
    if (!yogaClass) {
      return res.status(404).json({ error: "Class not found" });
    }

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

    const checkinId = `CH${String(maxNumber + 1).padStart(3, "0")}`;

    const newCheckin = new ClassRecord({
      checkinId,
      customerId,
      classId,
      datetime
    });

    await newCheckin.save();

    customer.classBalance = Number(customer.classBalance || 0) - 1;
    await customer.save();

    res.status(201).json({
      message: "Check-in saved successfully",
      checkin: newCheckin,
      classBalance: customer.classBalance
    });
  } catch (err) {
    console.error("Check-in save error:", err.message);
    res.status(500).json({ error: "Failed to save check-in" });
  }
});
*/
// ---------- PACKAGES ----------
app.get("/api/packages", requireRole(["admin", "staff", "member"]), async (req, res) => {
  try {
    if (!Package) return res.status(500).json({ error: "Package model not installed yet" });

    const packages = await Package.find({}).sort({ packageId: 1 });
    res.json(packages);
  } catch (err) {
    console.error("Packages load error:", err.message);
    res.status(500).json({ error: "Failed to load packages" });
  }
});

app.post("/api/packages/assign", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    if (!Package || !Customer || !PackageSale) {
      return res.status(500).json({ error: "Package/Customer/Sale models not installed yet" });
    }

    const { customerId, packageId } = req.body;

    if (!customerId || !packageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const pkg = await Package.findOne({ packageId });
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }

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

    const saleId = `S${String(maxNumber + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];

    const sale = new PackageSale({
      saleId,
      customerId,
      packageId: pkg.packageId,
      purchaseDate: today,
      startDate: today,
      endDate: today,
      amountPaid: pkg.price
    });

    await sale.save();

    customer.classBalance = Number(customer.classBalance || 0) + Number(pkg.classAmount || 0);
    await customer.save();

    res.status(201).json({
      message: "Package assigned successfully",
      sale,
      classBalance: customer.classBalance
    });
  } catch (err) {
    console.error("Assign package error:", err.message);
    res.status(500).json({ error: "Failed to assign package" });
  }
});

// ---------- PAGE ROUTES: ADMIN / STAFF ----------
app.get("/htmls/all-in-one.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "all-in-one.html"));
});

app.get("/htmls/dashboard.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "dashboard.html"));
});

app.get("/htmls/instructor.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "instructor.html"));
});

app.get("/htmls/customers.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "customers.html"));
});

app.get("/htmls/packages.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "packages.html"));
});

app.get("/htmls/class-schedule.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "class-schedule.html"));
});

app.get("/htmls/check-ins.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "check-ins.html"));
});

app.get("/htmls/roster.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "roster.html"));
});

app.get("/htmls/profile.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "profile.html"));
});

app.get("/htmls/user-management.html", requireRole(["admin", "staff"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "user-management.html"));
});

// ---------- PAGE ROUTES: MEMBER ----------
app.get("/htmls/dashboard.html", requireRole(["member"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "dashboard.html"));
});

app.get("/htmls/member-packages.html", requireRole(["member"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "member-packages.html"));
});

app.get("/htmls/member-class-schedule.html", requireRole(["member"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "member-class-schedule.html"));
});

app.get("/htmls/member-check-ins.html", requireRole(["member"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "member-check-ins.html"));
});

app.get("/htmls/member-profile.html", requireRole(["member"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "member-profile.html"));
});

app.get("/htmls/:page", requireLogin, (req, res) => {
  res.status(404).send("Page not found");
});

app.get("/htmls/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "htmls", "register.html"));
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/index.html in your browser.`);
});