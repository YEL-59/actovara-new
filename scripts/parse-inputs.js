#!/usr/bin/env node

/**
 * EasyTemplate v2.0 — 100% Accurate Universal Client Input, Figma, Screenshot & Chat Scanner
 * Scans:
 *  - inputs/client_docs/ (PDFs with zlib FlateDecode stream decompression, requirements.md, Telegram HTML/TXT/JSON)
 *  - inputs/figma/ (figma_links.md, exported design tokens JSON, exported frame images)
 *  - inputs/screenshots/ (extracts exact pixel width x height & aspect ratio from PNG/JPG/WebP headers)
 *  - inputs/modifications/ (feature bundles, update notes, revision screenshots, Telegram chats)
 *  - inputs/client_comms/ (incoming client messages for context-aware reply generation)
 * Outputs:
 *  - inputs/INTAKE_SUMMARY.md
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const inputsDir = path.join(rootDir, 'inputs');
const summaryOutPath = path.join(inputsDir, 'INTAKE_SUMMARY.md');

/**
 * Extract exact pixel dimensions (width x height) from PNG, JPEG, or WebP binary headers
 * so the AI can build 100% aspect-ratio-accurate layouts from screenshots and Figma exports.
 */
function getImageDimensions(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(65536);
    const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);

    if (bytesRead < 24) return null;

    // 1. PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR chunk at offset 16..24
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height, format: 'PNG' };
    }

    // 2. WebP: "RIFF"...."WEBP"
    if (
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const chunkHeader = buf.toString('ascii', 12, 16);
      if (chunkHeader === 'VP8 ' && bytesRead >= 30) {
        const width = buf.readUInt16LE(26) & 0x3fff;
        const height = buf.readUInt16LE(28) & 0x3fff;
        return { width, height, format: 'WEBP' };
      } else if (chunkHeader === 'VP8L' && bytesRead >= 25) {
        const b0 = buf[21];
        const b1 = buf[22];
        const b2 = buf[23];
        const b3 = buf[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height, format: 'WEBP' };
      } else if (chunkHeader === 'VP8X' && bytesRead >= 30) {
        const width = 1 + buf.readUIntLE(24, 3);
        const height = 1 + buf.readUIntLE(27, 3);
        return { width, height, format: 'WEBP' };
      }
    }

    // 3. JPEG: FF D8 ... scan for SOF0 (FF C0), SOF1 (FF C1), SOF2 (FF C2)
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < bytesRead) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1];
        if (marker === 0xff) {
          offset++;
          continue;
        }
        // SOF markers
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height, format: 'JPEG' };
        }
        const segLen = buf.readUInt16BE(offset + 2);
        if (segLen < 2) break;
        offset += 2 + segLen;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clean HTML entities and tags from Telegram Desktop messages.html
 */
function parseTelegramHtml(htmlContent) {
  const messages = [];
  const msgBlocks = htmlContent.split(/<div class="message default/g).slice(1);

  for (const block of msgBlocks) {
    const dateMatch = block.match(/title="([^"]+)"/);
    const fromMatch = block.match(/<div class="from_name">\s*([\s\S]*?)\s*<\/div>/);
    const replyMatch = block.match(/<div class="reply_to[^"]*">\s*([\s\S]*?)\s*<\/div>/);
    const textMatch = block.match(/<div class="text">\s*([\s\S]*?)\s*<\/div>/);
    const mediaMatch = block.match(/<div class="media_wrap[\s\S]*?<div class="title bold">\s*([\s\S]*?)\s*<\/div>/);

    const sender = fromMatch
      ? fromMatch[1].replace(/<[^>]+>/g, '').trim()
      : '↑ (Continued)';
    const date = dateMatch ? dateMatch[1].trim() : '';
    const replyContext = replyMatch
      ? ` (Replying to: ${replyMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()})`
      : '';

    let cleanText = '';
    if (textMatch) {
      cleanText = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    if (mediaMatch) {
      const mediaTitle = mediaMatch[1].replace(/<[^>]+>/g, '').trim();
      cleanText = cleanText ? `${cleanText} [Attached Media: ${mediaTitle}]` : `[Attached Media: ${mediaTitle}]`;
    }

    if (cleanText) {
      messages.push(`[${date}] ${sender}${replyContext}: ${cleanText}`);
    }
  }

  // Fallback if standard Telegram message divs weren't matched
  if (messages.length === 0) {
    const stripped = htmlContent
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped) messages.push(stripped.slice(0, 4000));
  }

  return messages;
}

/**
 * Parse Telegram Desktop result.json export
 */
function parseTelegramJson(jsonContent) {
  try {
    const parsed = JSON.parse(jsonContent);
    const list = parsed.messages || [];
    const results = [];
    for (const m of list) {
      if (m.type === 'message' && (m.text || m.photo || m.file)) {
        const textStr = Array.isArray(m.text)
          ? m.text.map((t) => (typeof t === 'string' ? t : t.text || '')).join('')
          : String(m.text || '');
        const mediaNote = m.photo
          ? ` [Photo: ${m.photo}]`
          : m.file
          ? ` [File: ${m.file}]`
          : '';
        const replyNote = m.reply_to_message_id ? ` (Reply to #${m.reply_to_message_id})` : '';
        const combined = `${textStr.trim()}${mediaNote}`.trim();
        if (combined) {
          results.push(`[${m.date || ''}] ${m.from || 'User'}${replyNote}: ${combined}`);
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Zero-dependency Deep PDF Text Extractor
 * Decompresses FlateDecode PDF streams via Node built-in zlib and parses PDF text operators (Tj / TJ)
 */
function extractPdfText(pdfPath) {
  try {
    const buffer = fs.readFileSync(pdfPath);
    const raw = buffer.toString('latin1');
    const extractedChunks = [];

    const decodePdfString = (str) =>
      str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .trim();

    const extractFromStreamContent = (contentStr) => {
      // Match (...) Tj and [(...)] TJ patterns
      const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
      let m;
      while ((m = tjRegex.exec(contentStr)) !== null) {
        const decoded = decodePdfString(m[1]);
        if (decoded.length > 1) extractedChunks.push(decoded);
      }

      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      while ((m = tjArrayRegex.exec(contentStr)) !== null) {
        const inner = m[1];
        const litRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
        let parts = [];
        let lm;
        while ((lm = litRegex.exec(inner)) !== null) {
          parts.push(decodePdfString(lm[1]));
        }
        const joined = parts.join('').trim();
        if (joined.length > 1) extractedChunks.push(joined);
      }
    };

    // 1. Decompress FlateDecode streams
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let sm;
    while ((sm = streamRegex.exec(raw)) !== null) {
      const streamBytes = Buffer.from(sm[1], 'latin1');
      try {
        const inflated = zlib.inflateSync(streamBytes).toString('latin1');
        extractFromStreamContent(inflated);
      } catch {
        extractFromStreamContent(sm[1]);
      }
    }

    // 2. Fallback to uncompressed literal scan if needed
    if (extractedChunks.length === 0) {
      const litRegex = /\(([^()\\]{3,})\)/g;
      let lm;
      while ((lm = litRegex.exec(raw)) !== null) {
        const cleaned = decodePdfString(lm[1]);
        if (cleaned.length > 3 && !/^[0-9\s.+-]+$/.test(cleaned)) {
          extractedChunks.push(cleaned);
        }
      }
    }

    const combined = extractedChunks.join(' ').replace(/\s+/g, ' ').trim();
    return (
      combined.slice(0, 1500) ||
      `Binary/Scanned PDF detected (${(buffer.length / 1024).toFixed(1)} KB). Ready for direct AI multimodal PDF reader.`
    );
  } catch (err) {
    return `PDF file present (${err.message})`;
  }
}

/**
 * Extract Figma URLs and Node IDs from markdown text (ignoring HTML comments)
 */
function extractFigmaLinks(content) {
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');
  const urlRegex = /https:\/\/(?:www\.)?figma\.com\/(?:file|design|proto|board)\/([a-zA-Z0-9]+)\/([^\s)?#]+)(?:\?[^\s)]*)?/g;
  const found = [];
  let match;
  while ((match = urlRegex.exec(cleanContent)) !== null) {
    const fullUrl = match[0];
    const fileKey = match[1];
    const fileName = decodeURIComponent(match[2]);
    const nodeMatch = fullUrl.match(/node-id=([^&\s)]+)/);
    found.push({
      url: fullUrl,
      fileKey,
      fileName,
      nodeId: nodeMatch ? decodeURIComponent(nodeMatch[1]) : 'root (0-1)',
    });
  }
  return found;
}

function listFilesSafe(dirPath, filterExts = null) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      results.push(...listFilesSafe(full, filterExts));
    } else {
      if (!filterExts || filterExts.includes(path.extname(e.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  return results;
}

function formatImageLine(rootDir, imgPath) {
  const rel = path.relative(rootDir, imgPath);
  const stat = fs.statSync(imgPath);
  const sizeKb = (stat.size / 1024).toFixed(1);
  const dims = getImageDimensions(imgPath);
  if (dims) {
    return `  - \`${rel}\` — **${dims.width}×${dims.height}px** (${dims.format}, ${sizeKb} KB)`;
  }
  return `  - \`${rel}\` (${sizeKb} KB)`;
}

function runIntakeParser() {
  console.log('\n===============================================================');
  console.log('   🔍 EasyTemplate Universal Client Input & Figma Scanner');
  console.log('===============================================================');

  const clientDocsDir = path.join(inputsDir, 'client_docs');
  const figmaDir = path.join(inputsDir, 'figma');
  const screenshotsDir = path.join(inputsDir, 'screenshots');
  const modsDir = path.join(inputsDir, 'modifications');
  const commsDir = path.join(inputsDir, 'client_comms');

  // 1. Scan PDFs
  const pdfFiles = [
    ...listFilesSafe(clientDocsDir, ['.pdf']),
    ...listFilesSafe(modsDir, ['.pdf']),
  ];

  // 2. Scan Telegram Chats (.html, .txt, .json)
  const htmlChats = [
    ...listFilesSafe(clientDocsDir, ['.html']),
    ...listFilesSafe(path.join(modsDir, 'telegram_chats'), ['.html']),
  ];
  const txtChats = [
    ...listFilesSafe(clientDocsDir, ['.txt']),
    ...listFilesSafe(path.join(modsDir, 'telegram_chats'), ['.txt']),
  ];
  const jsonChats = [
    ...listFilesSafe(clientDocsDir, ['.json']),
    ...listFilesSafe(path.join(modsDir, 'telegram_chats'), ['.json']),
  ];

  // 3. Scan Figma Links, Tokens, and Exports
  const figmaLinksFile = path.join(figmaDir, 'figma_links.md');
  const referencesFile = path.join(inputsDir, 'references.md');
  let figmaLinks = [];
  if (fs.existsSync(figmaLinksFile)) {
    figmaLinks.push(...extractFigmaLinks(fs.readFileSync(figmaLinksFile, 'utf-8')));
  }
  if (fs.existsSync(referencesFile)) {
    figmaLinks.push(...extractFigmaLinks(fs.readFileSync(referencesFile, 'utf-8')));
  }
  const imgExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
  const figmaTokens = listFilesSafe(path.join(figmaDir, 'tokens'));
  const figmaExports = listFilesSafe(path.join(figmaDir, 'exports'), imgExts);

  // 4. Scan Screenshots & Component Modification Bundles
  const screenshots = listFilesSafe(screenshotsDir, imgExts);
  const modScreenshots = listFilesSafe(path.join(modsDir, 'screenshots'), imgExts);
  const featureBundles = listFilesSafe(path.join(modsDir, 'features'));

  // 5. Scan Incoming Client Message (inputs/client_comms/incoming_message.md)
  const incomingMsgFile = path.join(commsDir, 'incoming_message.md');
  let incomingClientMsg = '';
  if (fs.existsSync(incomingMsgFile)) {
    const rawMsg = fs.readFileSync(incomingMsgFile, 'utf-8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith('#') && !line.startsWith('>'))
      .join('\n')
      .trim();
    if (rawMsg && !rawMsg.includes('Paste the client')) {
      incomingClientMsg = rawMsg;
    }
  }

  // Parse Telegram messages preview
  const extractedChatLines = [];
  for (const h of htmlChats) {
    const msgs = parseTelegramHtml(fs.readFileSync(h, 'utf-8'));
    extractedChatLines.push(...msgs.map((m) => `[HTML: ${path.basename(h)}] ${m}`));
  }
  for (const j of jsonChats) {
    const msgs = parseTelegramJson(fs.readFileSync(j, 'utf-8'));
    extractedChatLines.push(...msgs.map((m) => `[JSON: ${path.basename(j)}] ${m}`));
  }
  for (const t of txtChats) {
    const raw = fs.readFileSync(t, 'utf-8').trim();
    if (raw) {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
      extractedChatLines.push(...lines.map((l) => `[TXT: ${path.basename(t)}] ${l}`));
    }
  }

  // Build Markdown Summary
  const mdLines = [
    '# 📋 Automated Client Intake & Asset Summary (`inputs/INTAKE_SUMMARY.md`)',
    '',
    `> **Generated At**: ${new Date().toISOString()}`,
    '> **Command**: `npm run inputs` (`node scripts/parse-inputs.js`)',
    '',
    '---',
    '',
    '## 1. 🎨 Figma-to-Fullstack Links & Assets (`inputs/figma/`)',
    `- **Detected Figma URLs**: ${figmaLinks.length}`,
    ...figmaLinks.map(
      (f, idx) =>
        `  ${idx + 1}. **File**: \`${f.fileName}\` | **Key**: \`${f.fileKey}\` | **Node ID**: \`${f.nodeId}\` -> [Open Figma](${f.url})`
    ),
    `- **Exported Figma Token Files**: ${figmaTokens.length} (${figmaTokens.map((f) => path.basename(f)).join(', ') || 'None'})`,
    `- **Exported Figma Frame Images**: ${figmaExports.length}`,
    ...figmaExports.map((img) => formatImageLine(rootDir, img)),
    '',
    '---',
    '',
    '## 2. 📄 PDF Briefs & Client Documents (`inputs/client_docs/`)',
    `- **PDF Files Found**: ${pdfFiles.length}`,
    ...pdfFiles.map(
      (p) => `  - \`${path.relative(rootDir, p)}\`:\n    > ${extractPdfText(p)}`
    ),
    '',
    '---',
    '',
    '## 3. 💬 Parsed Telegram & Client Chat Messages (Overrides Older Briefs)',
    `- **HTML Chat Exports**: ${htmlChats.length} | **TXT Chats**: ${txtChats.length} | **JSON Chats**: ${jsonChats.length}`,
    `- **Total Extracted Chat Lines**: ${extractedChatLines.length}`,
    '```text',
    ...(extractedChatLines.length > 0
      ? extractedChatLines.slice(0, 80)
      : ['No non-comment chat messages detected yet.']),
    '```',
    '',
    '---',
    '',
    '## 4. 📸 UI Screenshots (with Exact Pixel Dimensions) & Modification Bundles',
    `- **Primary UI Screenshots (` + '`inputs/screenshots/`' + `)**: ${screenshots.length}`,
    ...screenshots.map((s) => formatImageLine(rootDir, s)),
    `- **Revision Screenshots (` + '`inputs/modifications/screenshots/`' + `)**: ${modScreenshots.length}`,
    ...modScreenshots.map((s) => formatImageLine(rootDir, s)),
    `- **Component Feature Bundles (` + '`inputs/modifications/features/`' + `)**: ${featureBundles.length}`,
    ...featureBundles.map((b) => `  - \`${path.relative(rootDir, b)}\``),
    '',
    '---',
    '',
    '## 5. ✉️ Latest Incoming Client Message (`inputs/client_comms/incoming_message.md`)',
    incomingClientMsg
      ? `\`\`\`text\n${incomingClientMsg}\n\`\`\``
      : '- No pending client message in `inputs/client_comms/incoming_message.md`.',
    '',
  ];

  fs.writeFileSync(summaryOutPath, mdLines.join('\n'), 'utf-8');

  console.log(`  ✅ Figma Links Detected       : ${figmaLinks.length}`);
  console.log(`  ✅ PDF Documents Detected     : ${pdfFiles.length}`);
  console.log(`  ✅ Telegram Chat Lines Parsed : ${extractedChatLines.length}`);
  console.log(`  ✅ UI Screenshots Found       : ${screenshots.length + modScreenshots.length + figmaExports.length}`);
  console.log(`  ✅ Pending Client Message     : ${incomingClientMsg ? 'YES (Ready for Reply)' : 'None'}`);
  console.log(`  ✅ Summary Written To         : inputs/INTAKE_SUMMARY.md`);
  console.log('===============================================================\n');
}

if (require.main === module) {
  runIntakeParser();
}

module.exports = { runIntakeParser, getImageDimensions, extractPdfText, parseTelegramHtml };
