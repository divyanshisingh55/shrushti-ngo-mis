const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(
  "C:\\Users\\Divyanshi Singh.000\\OneDrive\\Desktop\\Shrushti-MIS\\backend",
  "Turnover, Networth, Grant Received and Grant in Aid till 31-3-25.xlsx"
);

const wb = XLSX.readFile(filePath);
console.log("=== SHEET NAMES ===");
console.log(wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  console.log(`\n\n===== SHEET: ${sheetName} =====`);
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  // Print first 60 rows
  data.slice(0, 60).forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
  });
});
