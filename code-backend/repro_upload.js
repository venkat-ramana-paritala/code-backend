const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const XLSX = require('xlsx');

async function run() {
    // 1. Create a dummy excel file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
        { name: "Test Med 1", batchNumber: "B123", quantityAvailable: 50, expiryDate: "2025-12-31", "Supplier Name": "Test Supplier" },
        { name: "Test Med 2", batchNumber: "B456", quantityAvailable: 20, expiryDate: "2025-06-30", "Supplier Name": "Test Supplier" }
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "test_inventory.xlsx");

    const form = new FormData();
    form.append('file', fs.createReadStream('test_inventory.xlsx'));

    console.log("--- TEST 1: Upload WITH manual Content-Type header (Should Fail) ---");
    try {
        // This simulates the bug in Dashboard.js
        await axios.post('http://localhost:5001/api/inventory/upload', form, {
            headers: {
                ...form.getHeaders(), // In Node we normally need form.getHeaders(), but let's override it to simulate the bug
                'Content-Type': 'multipart/form-data' // This override removes the boundary
            }
        });
        console.log("Test 1 Result: SUCCESS (Unexpected)\n");
    } catch (err) {
        console.log("Test 1 Result: FAILED (Expected)");
        if (err.response) {
            console.log("Status:", err.response.status, err.response.data);
        } else {
            console.log("Error:", err.message);
        }
        console.log("");
    }

    console.log("--- TEST 2: Upload WITHOUT manual Content-Type header (Should Succeed) ---");
    try {
        const form2 = new FormData();
        form2.append('file', fs.createReadStream('test_inventory.xlsx'));

        // precise form headers (includes boundary)
        await axios.post('http://localhost:5001/api/inventory/upload', form2, {
            headers: form2.getHeaders()
        });
        console.log("Test 2 Result: SUCCESS (Expected)\n");
    } catch (err) {
        console.log("Test 2 Result: FAILED (Unexpected)");
        if (err.response) {
            console.log("Status:", err.response.status, err.response.data);
        } else {
            console.log("Error:", err.message);
        }
        console.log("");
    }
}

run();
