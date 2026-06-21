/**
 * Minimal, dependency-free ZIP reader for reading entries out of an
 * Open XML file (.pptx / .docx / .xlsx are all ZIP containers).
 *
 * This reads the central directory, then inflates local file entries with
 * node:zlib. It is intentionally a tiny subset: read-only, store + deflate,
 * good enough to pull slide XML and media entries out of a .pptx so that
 * render-qa can inspect a generated deck without any third-party deps.
 *
 * Returns a Map<entryName, Uint8Array> via readZip(buffer).
 */

import { inflateRawSync } from "node:zlib";

const SIG_CENTRAL = 0x02014b50; // PK\x01\x02  central directory file header
const SIG_LOCAL = 0x04034b50; // PK\x03\x04  local file header
const SIG_EOCD = 0x06054b50; // PK\x05\x06  end of central directory

function readU16(buf, off) {
  return buf[off] | (buf[off + 1] << 8);
}
function readU32(buf, off) {
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}

function findEocd(buf) {
  // EOCD is near the end; scan back up to 64KB.
  const maxBack = Math.min(buf.length, 65557);
  for (let i = buf.length - 22; i >= buf.length - maxBack; i--) {
    if (readU32(buf, i) === SIG_EOCD) return i;
  }
  throw new Error("zip-reader: end-of-central-directory record not found (not a zip?)");
}

/**
 * @param {Uint8Array|Buffer} input
 * @returns {Map<string, Uint8Array>} entryName -> decompressed bytes
 */
export function readZip(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const eocd = findEocd(buf);
  const cdEntries = readU16(buf, eocd + 8);
  const cdOffset = readU32(buf, eocd + 16);

  const out = new Map();
  let p = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    if (readU32(buf, p) !== SIG_CENTRAL) {
      throw new Error(`zip-reader: bad central directory entry at ${p}`);
    }
    const compression = readU16(buf, p + 10);
    const compressedSize = readU32(buf, p + 20);
    const uncompressedSize = readU32(buf, p + 24);
    const nameLen = readU16(buf, p + 28);
    const extraLen = readU16(buf, p + 30);
    const commentLen = readU16(buf, p + 32);
    const localHeaderOffset = readU32(buf, p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");

    // Jump to local header to find the real data offset (local extra field may differ).
    if (readU32(buf, localHeaderOffset) !== SIG_LOCAL) {
      throw new Error(`zip-reader: bad local header at ${localHeaderOffset} for ${name}`);
    }
    const localNameLen = readU16(buf, localHeaderOffset + 26);
    const localExtraLen = readU16(buf, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(dataOffset, dataOffset + compressedSize);

    let bytes;
    if (compression === 0) {
      bytes = raw;
    } else if (compression === 8) {
      bytes = inflateRawSync(raw);
    } else {
      throw new Error(`zip-reader: unsupported compression ${compression} for ${name}`);
    }

    if (uncompressedSize && bytes.length !== uncompressedSize) {
      // Trusting the inflated length over the central directory for safety.
    }
    out.set(name, bytes);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/**
 * List slide XML entry names in document order.
 * e.g. ppt/slides/slide1.xml, ppt/slides/slide2.xml, ...
 */
export function listSlides(zip) {
  return [...zip.keys()]
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => {
      const na = Number.parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
      const nb = Number.parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
      return na - nb;
    });
}
