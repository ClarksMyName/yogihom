const express = require("express");
const router = express.Router();
const waiverController = require("../controllers/waiverController.cjs");

router.get("/search", waiverController.search);
router.get("/getAll", waiverController.getAllWaivers);
router.get("/getWaiver", waiverController.getWaiver);
router.get("/getNextId", waiverController.getNextId);

router.post("/add", waiverController.add);
router.put("/updateWaiver", waiverController.updateWaiver);
router.delete("/deleteWaiver", waiverController.deleteWaiver);

module.exports = router;