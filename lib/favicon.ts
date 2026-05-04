import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

function icoFromPng(png: Buffer): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

export async function writeFaviconsFromImage(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const base = sharp(input)
    .resize(512, 512, {
      fit: "cover",
      position: "center",
    })
    .ensureAlpha();

  const faviconPng = await base.clone().resize(32, 32).png({ palette: false }).toBuffer();
  const iconPng = await base.clone().png({ palette: false }).toBuffer();
  const applePng = await base.clone().resize(180, 180).png({ palette: false }).toBuffer();
  const faviconIco = icoFromPng(faviconPng);

  const publicDir = path.join(process.cwd(), "public");
  const appDir = path.join(process.cwd(), "app");

  await Promise.all([
    fs.writeFile(path.join(publicDir, "favicon.ico"), faviconIco),
    fs.writeFile(path.join(appDir, "favicon.ico"), faviconIco),
    fs.writeFile(path.join(publicDir, "icon.png"), iconPng),
    fs.writeFile(path.join(publicDir, "apple-icon.png"), applePng),
  ]);

  return {
    faviconUrl: "/favicon.ico",
    iconUrl: "/icon.png",
    appleIconUrl: "/apple-icon.png",
  };
}
