#!/usr/bin/env node

/**
 * EasyTemplate Interactive Settings CLI (v2.0)
 * Allows developers to configure Language (English / Bangla),
 * Execution Strategy (including FIGMA_TO_FULLSTACK),
 * Universal Backend Stack (Express+Mongoose, Express+Prisma, NestJS, FastAPI, Custom),
 * and parse Client Inputs (PDF, Telegram Chat, Figma Links, Screenshots) with 1-key press.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const settingsPath = path.join(rootDir, 'settings.json');
const configPath = path.join(rootDir, 'project.config.md');
const memoryPath = path.join(rootDir, 'planning', 'MEMORY.md');
const statusPath = path.join(rootDir, 'PROJECT_STATUS.md');

function loadSettings() {
  const defaultSettings = {
    language: 'en',
    executionStrategy: 'FRONTEND_FIRST',
    backendStack: 'EXPRESS_MONGOOSE',
    designSource: 'FIGMA_AND_SCREENSHOTS',
    memoryTracking: true,
    autoBuildVerification: true,
    antiRegression: true,
    version: '2.0.0',
  };

  if (!fs.existsSync(settingsPath)) {
    saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

  if (fs.existsSync(configPath)) {
    try {
      let configContent = fs.readFileSync(configPath, 'utf-8');
      if (configContent.includes('- **Language Preference**:')) {
        configContent = configContent.replace(
          /- \*\*Language Preference\*\*:.*/g,
          `- **Language Preference**: \`${settings.language.toUpperCase()}\` (${settings.language === 'en' ? 'English' : 'Bangla'})`
        );
      }
      if (configContent.includes('- **Active Strategy**:')) {
        configContent = configContent.replace(
          /- \*\*Active Strategy\*\*:.*/g,
          `- **Active Strategy**: \`${settings.executionStrategy}\``
        );
      }
      if (configContent.includes('- **Active Backend Stack**:')) {
        configContent = configContent.replace(
          /- \*\*Active Backend Stack\*\*:.*/g,
          `- **Active Backend Stack**: \`${settings.backendStack}\``
        );
      }
      fs.writeFileSync(configPath, configContent, 'utf-8');
    } catch {
      // ignore
    }
  }
}

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function printHeader(settings) {
  const langDisplay = settings.language === 'bn' ? 'বাংলা (Bangla - bn)' : 'English (en)';
  if (console.clear) console.clear();
  console.log('===============================================================');
  console.log('   🛠️  EasyTemplate v2.0 — Universal AI Full-Stack Settings    ');
  console.log('===============================================================');
  console.log(`  🌐 Current Language  : \x1b[32m${langDisplay}\x1b[0m`);
  console.log(`  ⚡ Execution Strategy: \x1b[36m${settings.executionStrategy}\x1b[0m`);
  console.log(`  ⚙️  Backend Stack     : \x1b[35m${settings.backendStack}\x1b[0m`);
  console.log(`  🎨 Design Source     : \x1b[33m${settings.designSource}\x1b[0m`);
  console.log(`  🧠 Memory & Guard    : \x1b[32mACTIVE (Zero-State-Loss + Anti-Regression)\x1b[0m`);
  console.log('---------------------------------------------------------------');
  console.log('  [1] 🌐 Change Language (English / বাংলা)');
  console.log('  [2] ⚡ Change Execution Strategy (FRONTEND_FIRST / FIGMA_TO_FULLSTACK / BOTH / BACKEND)');
  console.log('  [3] ⚙️  Change Backend Stack (Express+Mongoose / Prisma+Postgres / NestJS / FastAPI / Any)');
  console.log('  [4] 🔍 Scan & Parse Client Inputs (PDF, Telegram HTML/TXT, Figma URLs, Screenshots)');
  console.log('  [5] 📝 Open Client Modification Guide (Senior Full-Stack Ripple Protocol)');
  console.log('  [6] 🧠 View Current System State & Memory Snapshot');
  console.log('  [7] 🔄 Sync Framework to Another Project (e.g. C:\\Users\\Tofayel\\Desktop\\door)');
  console.log('  [8] 💬 Client Message & Reply Generator (inputs/client_comms/incoming_message.md)');
  console.log('  [0] 🚪 Exit');
  console.log('===============================================================');
}

function handleLanguageMenu(settings, callback) {
  const rl = createRl();
  console.log('\n--- 🌐 Select Language Preference ---');
  console.log('  [1] English (All AI prompt responses, task cards, and suggestions in English)');
  console.log('  [2] বাংলা   (সকল AI রেসপন্স, টাস্ক সমাপ্তি রিপোর্ট এবং পরবর্তী ধাপ বাংলায়)');
  console.log('  [b] Back to Main Menu');
  console.log('-------------------------------------');
  rl.question('Enter choice [1, 2, english, bangla]: ', (ans) => {
    rl.close();
    const clean = ans.trim().toLowerCase();
    if (clean === '1' || clean === 'english' || clean === 'en') {
      settings.language = 'en';
      saveSettings(settings);
      console.log('\n\x1b[32m✓ Language successfully set to: English (en)\x1b[0m\n');
    } else if (clean === '2' || clean === 'bangla' || clean === 'bn' || clean === 'বাংলা') {
      settings.language = 'bn';
      saveSettings(settings);
      console.log('\n\x1b[32m✓ ভাষা সফলভাবে পরিবর্তিত হয়েছে: বাংলা (bn)\x1b[0m\n');
    }
    setTimeout(callback, 1000);
  });
}

function handleStrategyMenu(settings, callback) {
  const rl = createRl();
  console.log('\n--- ⚡ Select Execution Strategy ---');
  console.log('  [1] FRONTEND_FIRST     (Screenshots/Figma UI demo priority with mock data first)');
  console.log('  [2] FIGMA_TO_FULLSTACK (Figma MCP/Links -> Tokens -> 6-State UI -> DB ERD -> Live APIs)');
  console.log('  [3] BOTH_FULLSTACK     (Concurrent Backend Models/APIs + Frontend UI integration)');
  console.log('  [4] BACKEND_FIRST      (Database schemas, ERD, API endpoints, and validation first)');
  console.log('  [b] Back');
  console.log('------------------------------------');
  rl.question('Enter choice [1-4]: ', (ans) => {
    rl.close();
    const clean = ans.trim();
    if (clean === '1') settings.executionStrategy = 'FRONTEND_FIRST';
    else if (clean === '2') settings.executionStrategy = 'FIGMA_TO_FULLSTACK';
    else if (clean === '3') settings.executionStrategy = 'BOTH_FULLSTACK';
    else if (clean === '4') settings.executionStrategy = 'BACKEND_FIRST';
    saveSettings(settings);
    console.log(`\n\x1b[32m✓ Execution Strategy set to: ${settings.executionStrategy}\x1b[0m\n`);
    setTimeout(callback, 1000);
  });
}

function handleBackendStackMenu(settings, callback) {
  const rl = createRl();
  console.log('\n--- ⚙️ Select Universal Backend Stack ---');
  console.log('  [1] EXPRESS_MONGOOSE        (Node.js + Express + TypeScript + Mongoose / MongoDB)');
  console.log('  [2] EXPRESS_PRISMA_POSTGRES (Node.js + Express + TypeScript + Prisma / PostgreSQL)');
  console.log('  [3] NESTJS_PRISMA_POSTGRES  (NestJS Modular + TypeScript + Prisma / PostgreSQL + Redis)');
  console.log('  [4] FASTAPI_PYTHON          (Python 3.11+ + FastAPI + Pydantic + SQLAlchemy / Motor)');
  console.log('  [5] CUSTOM_ANY              (Go / Laravel / Supabase / Custom REST or GraphQL)');
  console.log('  [b] Back');
  console.log('-----------------------------------------');
  rl.question('Enter choice [1-5]: ', (ans) => {
    rl.close();
    const clean = ans.trim();
    if (clean === '1') settings.backendStack = 'EXPRESS_MONGOOSE';
    else if (clean === '2') settings.backendStack = 'EXPRESS_PRISMA_POSTGRES';
    else if (clean === '3') settings.backendStack = 'NESTJS_PRISMA_POSTGRES';
    else if (clean === '4') settings.backendStack = 'FASTAPI_PYTHON';
    else if (clean === '5') settings.backendStack = 'CUSTOM_ANY';
    saveSettings(settings);
    console.log(`\n\x1b[32m✓ Backend Stack set to: ${settings.backendStack}\x1b[0m\n`);
    setTimeout(callback, 1000);
  });
}

function handleParseInputs(callback) {
  try {
    const parser = require('./parse-inputs');
    parser.runIntakeParser();
  } catch (err) {
    console.log(`Error running input parser: ${err.message}`);
  }
  const rl = createRl();
  rl.question('\nPress Enter to return to menu...', () => {
    rl.close();
    callback();
  });
}

function showMemorySnapshot(callback) {
  if (fs.existsSync(statusPath)) {
    const content = fs.readFileSync(statusPath, 'utf-8');
    console.log('\n--- 📊 Live Project Status & Module Checklist ---');
    console.log(content);
    console.log('-------------------------------------------------');
  } else if (fs.existsSync(memoryPath)) {
    const content = fs.readFileSync(memoryPath, 'utf-8');
    const lines = content.split('\n').slice(0, 35).join('\n');
    console.log('\n--- 🧠 Active System State Snapshot ---');
    console.log(lines);
    console.log('--------------------------------------');
  }
  const rl = createRl();
  rl.question('\nPress Enter to return to menu...', () => {
    rl.close();
    callback();
  });
}

function showModificationGuide(callback) {
  console.log('\n--- 📝 How to Handle Client Modifications & Revisions ---');
  console.log('1. Put your update instructions into: inputs/modifications/update_notes/updates.md');
  console.log('   (Or drop Telegram messages.html / telegram_chat.txt into inputs/modifications/telegram_chats/)');
  console.log('2. For single component changes, drop screenshot + notes.txt into: inputs/modifications/features/<name>/');
  console.log('3. For Figma updates, paste the frame URL into: inputs/figma/figma_links.md');
  console.log('4. Open AI Chat and paste the 1-Click Modification Prompt from PROMPT_SHORTCUT.md!');
  console.log('---------------------------------------------------------');
  const rl = createRl();
  rl.question('\nPress Enter to return to menu...', () => {
    rl.close();
    callback();
  });
}

function handleSyncPrompt(callback) {
  const rl = createRl();
  console.log('\n--- 🔄 Sync EasyTemplate Framework to Another Project ---');
  rl.question('Enter target project path (e.g. C:\\Users\\Tofayel\\Desktop\\door): ', (target) => {
    rl.close();
    const cleanTarget = target.trim();
    if (!cleanTarget) {
      console.log('Cancelled.');
      setTimeout(callback, 1000);
      return;
    }

    try {
      const syncModule = require('./sync-core');
      syncModule.syncTo(rootDir, cleanTarget);
      console.log(`\n\x1b[32m✓ Successfully synced to: ${cleanTarget}\x1b[0m\n`);
    } catch (err) {
      console.log(`\nSync error: ${err.message}`);
    }
    setTimeout(callback, 2000);
  });
}

function mainMenu() {
  const settings = loadSettings();
  printHeader(settings);
  const rl = createRl();
  rl.question('Enter choice [0-7]: ', (choice) => {
    rl.close();
    const c = choice.trim();
    switch (c) {
      case '1':
        handleLanguageMenu(settings, mainMenu);
        break;
      case '2':
        handleStrategyMenu(settings, mainMenu);
        break;
      case '3':
        handleBackendStackMenu(settings, mainMenu);
        break;
      case '4':
        handleParseInputs(mainMenu);
        break;
      case '5':
        showModificationGuide(mainMenu);
        break;
      case '6':
        showMemorySnapshot(mainMenu);
        break;
      case '7':
        handleSyncPrompt(mainMenu);
        break;
      case '8': {
        const replyHelper = require('./client-reply');
        replyHelper.runClientReplyHelper();
        const rl2 = createRl();
        rl2.question('\nPress Enter to return to menu...', () => {
          rl2.close();
          mainMenu();
        });
        break;
      }
      case '0':
      case 'exit':
      case 'q':
        console.log('\nGoodbye! Settings saved to settings.json.\n');
        process.exit(0);
        break;
      default:
        console.log('\nInvalid choice. Try again.');
        setTimeout(mainMenu, 1000);
    }
  });
}

// Direct CLI flags support:
// node scripts/settings.js --lang en | --stack NESTJS_PRISMA_POSTGRES | --strategy FIGMA_TO_FULLSTACK
const args = process.argv.slice(2);
if (args.length > 0) {
  const settings = loadSettings();
  if (args.includes('--lang') || args.includes('-l')) {
    const idx = args.findIndex((a) => a === '--lang' || a === '-l');
    const val = (args[idx + 1] || '').toLowerCase();
    if (val === 'en' || val === 'english') {
      settings.language = 'en';
      saveSettings(settings);
      console.log('Language set to English (en).');
      process.exit(0);
    } else if (val === 'bn' || val === 'bangla') {
      settings.language = 'bn';
      saveSettings(settings);
      console.log('Language set to Bangla (bn).');
      process.exit(0);
    }
  }
  if (args.includes('--stack')) {
    const idx = args.findIndex((a) => a === '--stack');
    const val = (args[idx + 1] || '').toUpperCase();
    if (val) {
      settings.backendStack = val;
      saveSettings(settings);
      console.log(`Backend Stack set to ${val}.`);
      process.exit(0);
    }
  }
}

mainMenu();
