const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const imagesDir = path.join(process.cwd(), "public", "images");
const targetSizeKB = 500; // Target max size of 500KB per image

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return;
  }

  const stats = fs.statSync(filePath);
  const sizeInMB = stats.size / (1024 * 1024);

  // Only compress images larger than 1MB
  if (sizeInMB < 1) {
    console.log(
      `Skipping ${path.basename(filePath)} (${sizeInMB.toFixed(2)}MB - already small)`
    );
    return;
  }

  console.log(
    `Compressing ${path.basename(filePath)} (${sizeInMB.toFixed(2)}MB)...`
  );

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Create backup
    const backupPath = filePath + ".backup";
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }

    // Resize if very large
    let processor = image;
    if (metadata.width > 2000) {
      processor = processor.resize(2000, null, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Compress based on format
    if (ext === ".jpg" || ext === ".jpeg") {
      await processor
        .jpeg({ quality: 80, progressive: true })
        .toFile(filePath + ".tmp");
    } else if (ext === ".png") {
      await processor
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(filePath + ".tmp");
    } else if (ext === ".webp") {
      await processor.webp({ quality: 80 }).toFile(filePath + ".tmp");
    }

    // Check if compression was successful
    const newStats = fs.statSync(filePath + ".tmp");
    const newSizeInMB = newStats.size / (1024 * 1024);

    if (newSizeInMB < sizeInMB) {
      fs.renameSync(filePath + ".tmp", filePath);
      console.log(
        `✓ Compressed to ${newSizeInMB.toFixed(2)}MB (saved ${(sizeInMB - newSizeInMB).toFixed(2)}MB)`
      );
    } else {
      fs.unlinkSync(filePath + ".tmp");
      console.log(`✗ Compression didn't reduce size, keeping original`);
    }
  } catch (error) {
    console.error(
      `Error compressing ${path.basename(filePath)}:`,
      error.message
    );
    if (fs.existsSync(filePath + ".tmp")) {
      fs.unlinkSync(filePath + ".tmp");
    }
  }
}

async function compressAllImages() {
  const files = fs.readdirSync(imagesDir);

  console.log(`Found ${files.length} files in ${imagesDir}\n`);

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    if (fs.statSync(filePath).isFile()) {
      await compressImage(filePath);
    }
  }

  console.log("\n✓ Image compression complete!");
}

compressAllImages().catch(console.error);
