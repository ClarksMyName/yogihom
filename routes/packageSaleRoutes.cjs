const express = require("express");
const router = express.Router();
const packageSaleController = require("../controllers/packageSaleController.cjs");

router.get("/search", packageSaleController.search);
router.get("/getAll", packageSaleController.getAllSales);
router.get("/getSale", packageSaleController.getSale);
router.get("/getNextId", packageSaleController.getNextId);

router.post("/add", packageSaleController.add);
router.put("/updateSale", packageSaleController.updateSale);
router.delete("/deleteSale", packageSaleController.deleteSale);

module.exports = router;