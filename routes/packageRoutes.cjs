const express = require("express");
const router = express.Router();
const packageController = require("../controllers/packageController.cjs");

router.get("/search", packageController.search);
router.get("/getAll", packageController.getAllPackages);
router.get("/getPackage", packageController.getPackage);
router.get("/getNextId", packageController.getNextId);
router.get("/getPackageIds", packageController.getPackageIds);

router.post("/add", packageController.add);
router.put("/updatePackage", packageController.updatePackage);
router.delete("/deletePackage", packageController.deletePackage);

module.exports = router;