const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController.cjs");

router.get("/search", instructorController.search);
router.get("/getAll", instructorController.getAllInstructors);
router.get("/getInstructor", instructorController.getInstructor);
router.get("/getNextId", instructorController.getNextId);
router.get("/getInstructorIds", instructorController.getInstructorIds);

router.post("/add", instructorController.add);
router.put("/updateInstructor", instructorController.updateInstructor);
router.delete("/deleteInstructor", instructorController.deleteInstructor);

module.exports = router;