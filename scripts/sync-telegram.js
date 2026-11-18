'use strict';

/**
 * Syncs new messages from a Telegram Group Bot into inputs/client_docs/telegram_chat.txt
 * and refreshes inputs/INTAKE_SUMMARY.md via scripts/parse-inputs.js.
 *
 * Required env var: TELEGRAM_BOT_TOKEN (in .env, .env.local, or process.env)
 * Optional env var: TELEGRAM_CHAT_ID (filter to a specific group/supergroup ID)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHAT_FILE = path.join(ROOT, 'inputs', 'client_docs', 'telegram_chat.txt');
const STATE_FILE = path.join(ROOT, 'inputs', 'client_docs', '.telegram-state.json');

function loadEnvFiles() {
  for (const name of ['.env', '.env.local']) {
    const filePath = path.join(ROOT, name);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    // Fall back to clean state if file is unreadable.
  }
  return { lastUpdateId: 0 };
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function formatTimestamp(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSender(from) {
  if (!from) return 'Unknown';
  const full = [from.first_name, from.last_name].filter(Boolean).join(' ').trim() || 'User';
  return from.username ? `${full} (@${from.username})` : full;
}

function extractContent(msg) {
  const parts = [];
  if (msg.text) parts.push(msg.text.trim());
  if (msg.caption) parts.push(msg.caption.trim());
  if (msg.document) parts.push(`[Document: ${msg.document.file_name || 'file'}]`);
  if (msg.photo) parts.push('[Photo]');
  if (msg.voice) parts.push('[Voice note]');
  return parts.join(' ').replace(/\r?\n+/g, ' ').trim();
}

async function fetchUpdates(token, offset) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&limit=100&timeout=0`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Telegram API returned HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  return data.result || [];
}

async function main() {
  loadEnvFiles();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = process.env.TELEGRAM_CHAT_ID ? String(process.env.TELEGRAM_CHAT_ID).trim() : '';

  if (!token) {
    console.log('TELEGRAM_BOT_TOKEN is not set.');
    console.log('Add TELEGRAM_BOT_TOKEN=<your-bot-token> to .env.local (and optionally TELEGRAM_CHAT_ID=<group-id>).');
    process.exit(1);
  }

  const state = readState();
  let offset = state.lastUpdateId ? state.lastUpdateId + 1 : 0;
  let maxUpdateId = state.lastUpdateId || 0;
  const linesToAppend = [];

  while (true) {
    const updates = await fetchUpdates(token, offset);
    if (updates.length === 0) break;

    for (const upd of updates) {
      if (upd.update_id > maxUpdateId) maxUpdateId = upd.update_id;
      const msg = upd.message || upd.edited_message || upd.channel_post;
      if (!msg || !msg.chat) continue;

      const chatId = String(msg.chat.id);
      if (targetChatId && chatId !== targetChatId) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const ts = formatTimestamp(msg.date || Math.floor(Date.now() / 1000));
      const sender = formatSender(msg.from);
      const chatTitle = msg.chat.title ? ` (${msg.chat.title} | ${chatId})` : ` (${chatId})`;
      const editedTag = upd.edited_message ? ' [edited]' : '';
      linesToAppend.push(`[${ts}] ${sender}${chatTitle}${editedTag}: ${content}`);
    }

    offset = maxUpdateId + 1;
    if (updates.length < 100) break;
  }

  if (maxUpdateId > (state.lastUpdateId || 0)) {
    writeState({ lastUpdateId: maxUpdateId, updatedAt: new Date().toISOString() });
  }

  if (linesToAppend.length === 0) {
    console.log('No new Telegram messages found.');
    return;
  }

  fs.mkdirSync(path.dirname(CHAT_FILE), { recursive: true });
  const existing = fs.existsSync(CHAT_FILE) ? fs.readFileSync(CHAT_FILE, 'utf8') : '';
  const prefix = existing && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(CHAT_FILE, prefix + linesToAppend.join('\n') + '\n', 'utf8');

  console.log(`Synced ${linesToAppend.length} new message(s) to inputs/client_docs/telegram_chat.txt.`);

  execSync('node scripts/parse-inputs.js', { cwd: ROOT, stdio: 'inherit' });
}

main().catch((err) => {
  console.error('Telegram sync failed:', err.message);
  process.exit(1);
});
