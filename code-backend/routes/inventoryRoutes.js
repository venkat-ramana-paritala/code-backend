const axios = require("axios");

const express = require("express");
const router = express.Router();

const Medicine = require("../models/Medicine");
const multer = require("multer");
const XLSX = require("xlsx");

const upload = multer({ dest: "uploads/" });


router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ Expiry_Date: 1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ADD a new medicine
router.post("/add", async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();

    res.status(201).json({
      message: "Medicine added successfully",
      medicine,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET expiry alerts (expired + near expiry)
router.get("/alerts/expiry", async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const expired = await Medicine.find({
      Expiry_Date: { $lt: today }
    });

    const nearExpiry = await Medicine.find({
      Expiry_Date: { $gte: today, $lte: next30Days }
    }).sort({ Expiry_Date: 1 });

    res.json({
      expiredCount: expired.length,
      nearExpiryCount: nearExpiry.length,
      expired,
      nearExpiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET low stock alerts
// Note: Low Stock logic might need adjustment. Using Qty_Received as proxy for availability?
// But Qty_Received is purchase amount. User didn't specify "Current Stock".
// For now, I'll assume Qty_Received decreases or is used to track. 
// However, the schema seems to be "Purchase" record.
// If this is a Purchase Log, then Calculating "Current Stock" requires aggregating purchases - sales.
// User Request said: "the data model should be like... Purchase_ID..."
// Assuming for now we track stock on this record directly or this record represents the current batch stock.
// I will alert based on Qty_Received for now, assuming it is updated on sale.
router.get("/alerts/low-stock", async (req, res) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;

    const lowStockMedicines = await Medicine.find({
      Qty_Received: { $lt: LOW_STOCK_THRESHOLD }
    });

    res.json({
      lowStockCount: lowStockMedicines.length,
      lowStockMedicines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// UPLOAD inventory via Excel
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const medicines = rows.map((row) => ({
      Purchase_ID: row.Purchase_ID || row["Purchase ID"] || `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      Date_Received: new Date(row.Date_Received || row["Date Received"] || Date.now()),
      Drug_Name: row.Drug_Name || row["Drug Name"] || row.name || "",
      Supplier_Name: row.Supplier_Name || row["Supplier Name"] || row.Supplier || row.supplier || "Unknown Supplier",
      Batch_Number: row.Batch_Number || row["Batch Number"] || row.batchNumber || "",
      Qty_Received: Number(row.Qty_Received || row["Qty Received"] || row.quantityAvailable || 0),
      Unit_Cost_Price: Number(row.Unit_Cost_Price || row["Unit Cost Price"] || 0),
      Total_Purchase_Cost: Number(row.Total_Purchase_Cost || row["Total Purchase Cost"] || 0),
      Expiry_Date: new Date(row.Expiry_Date || row["Expiry Date"] || row.expiryDate),
    }));


    // filter out broken rows
    const validMedicines = medicines.filter(
      (m) =>
        m.Drug_Name &&
        m.Batch_Number &&
        !isNaN(m.Qty_Received) &&
        !isNaN(m.Expiry_Date.getTime())
      // We now default Supplier to "Unknown Supplier" so it won't fail validation
    );

    if (validMedicines.length === 0) {
      return res.status(400).json({
        error: "No valid rows found. Check Excel headers (Drug Name, Batch Number, Qty Received, Expiry Date)."
      });
    }

    try {
      await Medicine.insertMany(validMedicines);
    } catch (dbError) {
      console.error("DB INSERT ERROR:", dbError);
      return res.status(400).json({ error: "Database error: " + dbError.message });
    }

    res.json({
      message: "Inventory uploaded successfully",
      inserted: validMedicines.length,
      skipped: medicines.length - validMedicines.length,
    });
  } catch (error) {
    console.error("UPLOAD ERROR FULL:", error);
    console.error("ERROR MESSAGE:", error.message);
    res.status(500).json({ error: error.message });
  }

});

// CLEAR ALL inventory
router.delete("/", async (req, res) => {
  try {
    await Medicine.deleteMany({});
    res.json({ message: "Inventory cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
