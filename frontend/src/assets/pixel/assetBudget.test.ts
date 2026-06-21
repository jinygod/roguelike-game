/// <reference types="node" />

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assetDirectory = resolve("src/assets/pixel");
const spriteFiles = [
  "archer.png",
  "mage.png",
  "rat.png",
  "slime.png",
  "warrior.png",
] as const;
const backgroundFile = "goblin-forest.png";
const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function inspectPng(fileName: string) {
  const assetPath = resolve(assetDirectory, fileName);
  const header = readFileSync(assetPath).subarray(0, 24);

  expect(header.subarray(0, 8)).toEqual(pngSignature);
  expect(header.toString("ascii", 12, 16)).toBe("IHDR");

  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
    bytes: statSync(assetPath).size,
  };
}

describe("pixel asset budgets", () => {
  it.each(spriteFiles)(
    "keeps %s at 256x256 and no larger than 160KB",
    (fileName) => {
      const asset = inspectPng(fileName);

      expect(asset.width).toBe(256);
      expect(asset.height).toBe(256);
      expect(asset.bytes).toBeLessThanOrEqual(160 * 1024);
    },
  );

  it("keeps the forest background at 1440x810 and no larger than 900KB", () => {
    const asset = inspectPng(backgroundFile);

    expect(asset.width).toBe(1440);
    expect(asset.height).toBe(810);
    expect(asset.bytes).toBeLessThanOrEqual(900 * 1024);
  });

  it("keeps all pixel art assets within a 1.5MB transfer budget", () => {
    const totalBytes = [...spriteFiles, backgroundFile].reduce(
      (total, fileName) =>
        total +
        statSync(resolve(assetDirectory, fileName)).size,
      0,
    );

    expect(totalBytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });
});
