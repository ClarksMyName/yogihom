const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController.cjs");

router.get("/search", classController.search);
router.get("/getAll", classController.getAllClasses);
router.get("/getClass", classController.getClass);
router.get("/getNextId", classController.getNextId);
router.get("/getClassIds", classController.getClassIds);

router.post("/add", classController.add);
router.put("/updateClass", classController.updateClass);
router.delete("/deleteClass", classController.deleteClass);

module.exports = router;