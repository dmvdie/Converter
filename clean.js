// clean.js
// Usage: node clean.js
// Deletes all files in uploads/ and outputs/ directories (except .gitkeep if present)

const fs = require("fs");
const path = require("path");

const dirs = ["uploads", "outputs", "tmp"];

dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      if (file !== ".gitkeep") {
        const filePath = path.join(dirPath, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`[CLEAN] Deleted directory: ${filePath}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`[CLEAN] Deleted file: ${filePath}`);
        }
      }
    });
  }
});

console.log("Uploads and outputs cleaned.");
