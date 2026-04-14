const express = require("express");
const router = express.Router();
const classRecordController = require("../controllers/classRecordController.cjs");

router.get("/getAll", classRecordController.getAllRecords);
router.get("/getRecord", classRecordController.getRecord);
router.get("/getNextId", classRecordController.getNextId);

router.post("/add", classRecordController.add);
router.put("/updateRecord", classRecordController.updateRecord);
router.delete("/deleteRecord", classRecordController.deleteRecord);

module.exports = router;