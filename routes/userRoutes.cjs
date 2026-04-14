const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.cjs");

router.get("/search", userController.search);
router.get("/getAll", userController.getAllUsers);
router.get("/getUser", userController.getUser);
router.put("/updateRole", userController.updateUserRole);

module.exports = router;