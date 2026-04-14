const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController.cjs");

router.get("/search", customerController.search);
router.get("/getAll", customerController.getAllCustomers);
router.get("/getCustomer", customerController.getCustomer);
router.get("/getNextId", customerController.getNextId);
router.get("/getCustomerIds", customerController.getCustomerIds);

router.post("/add", customerController.add);
router.put("/updateCustomer", customerController.updateCustomer);
router.delete("/deleteCustomer", customerController.deleteCustomer);

module.exports = router;