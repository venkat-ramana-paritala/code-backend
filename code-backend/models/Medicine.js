const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  Purchase_ID: {
    type: String,
    required: true,
  },
  Date_Received: {
    type: Date,
    required: true,
  },
  Drug_Name: {
    type: String,
    required: true,
  },
  Supplier_Name: {
    type: String,
    required: true,
  },
  Batch_Number: {
    type: String,
    required: true,
  },
  Qty_Received: {
    type: Number,
    required: true,
  },
  Unit_Cost_Price: {
    type: Number,
    required: true,
  },
  Total_Purchase_Cost: {
    type: Number,
    required: true,
  },
  Expiry_Date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Medicine", medicineSchema);
