#!/usr/bin/env node

/**
 * EasyTemplate v2.0 — Client Message & Conversation Context Builder (npm run reply)
 * Reads:
 *  - inputs/client_comms/incoming_message.md
 *  - inputs/client_comms/reply_history.md
 *  - inputs/client_docs/telegram_chat.txt (or messages.html)
 *  - PROJECT_STATUS.md & planning/MEMORY.md
 * Outputs a ready-to-paste AI prompt that drafts a Senior Developer reply AND executes any needed modifications.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const incomingFile = path.join(rootDir, 'inputs', 'client_comms', 'incoming_message.md');
const settingsFile = path.join(rootDir, 'settings.json');

function runClientReplyHelper() {
  let lang = 'en';
  if (fs.existsSync(settingsFile)) {
    try {
      const s = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      if (s.language) lang = s.language;
    } catch {
      // ignore
    }
  }

  let incomingMsg = '';
  if (fs.existsSync(incomingFile)) {
    incomingMsg = fs
      .readFileSync(incomingFile, 'utf-8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>'))
      .join('\n')
      .trim();
  }

  console.log('\n===============================================================');
  console.log('   💬 EasyTemplate Client Message & Senior Developer Reply Hub');
  console.log('===============================================================');
  console.log(`  📄 Message File : inputs/client_comms/incoming_message.md`);
  console.log(`  📜 Reply History: inputs/client_comms/reply_history.md`);
  console.log(`  🌐 Active Lang  : ${lang.toUpperCase()}`);
  console.log('---------------------------------------------------------------');

  if (!incomingMsg || incomingMsg.includes("Paste the client's message here")) {
    console.log('  ⚠️  No new client message pasted in inputs/client_comms/incoming_message.md yet.');
    console.log('  💡 Paste the client message there (or directly in AI chat) and copy this prompt:\n');
  } else {
    console.log('  ✅ Detected Incoming Client Message:\n');
    console.log(`  "${incomingMsg.slice(0, 250)}${incomingMsg.length > 250 ? '...' : ''}"\n`);
    console.log('  📋 Copy & Paste this exact command into your AI Chat:\n');
  }

  if (lang === 'bn') {
    console.log('```text');
    console.log(
      'inputs/client_comms/incoming_message.md ফাইল থেকে ক্লায়েন্টের নতুন মেসেজটি পড়ো। সাথে planning/MEMORY.md, PROJECT_STATUS.md এবং পূর্বের কনভার্সেশন হিস্ট্রি মিলিয়ে `.agents/skills/client-communication/SKILL.md` অনুযায়ী ক্লায়েন্টকে পাঠানোর জন্য প্রফেশনাল Senior Developer রিপ্লাই তৈরি করো (Telegram/WhatsApp এবং Fiverr/Upwork ভার্সন)। মেসেজে কোনো কোড মডিফিকেশন চাওয়া হলে `.agents/skills/client-modification/SKILL.md` অনুযায়ী ফুল-স্ট্যাক চেঞ্জ করো এবং planning/MEMORY.md আপডেট করো।'
    );
    console.log('```');
  } else {
    console.log('```text');
    console.log(
      'Read the client message in inputs/client_comms/incoming_message.md along with planning/MEMORY.md, PROJECT_STATUS.md, and our conversation history. Follow .agents/skills/client-communication/SKILL.md to draft a Senior Developer reply (Quick Telegram/WhatsApp version + Detailed Fiverr/Upwork version), execute any requested full-stack code modifications via .agents/skills/client-modification/SKILL.md, and update planning/MEMORY.md.'
    );
    console.log('```');
  }
  console.log('===============================================================\n');
}

if (require.main === module) {
  runClientReplyHelper();
}

module.exports = { runClientReplyHelper };
