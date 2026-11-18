const fs = require('fs');
const path = require('path');
const { resetProjectState } = require('./new-project');

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next') continue;
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
  } else {
    const parent = path.dirname(dst);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dst);
  }
}

function syncTo(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  // 1. Core Framework Files
  const coreFiles = [
    'settings.json',
    'AGENTS.md',
    'HOW_TO_USE_BN.md',
    'HOW_TO_USE_EN.md',
    'PROJECT_STRUCTURE.md',
    'PROMPT_SHORTCUT.md',
    'project.config.md',
    'backend/AGENTS.md',
    'frontend/AGENTS.md',
    'frontend/DESIGN_GUIDELINES.md',
  ];

  for (const f of coreFiles) {
    const s = path.join(sourceDir, f);
    const d = path.join(targetDir, f);
    if (fs.existsSync(s)) {
      const parent = path.dirname(d);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(s, d);
      console.log(`  [+] Synced file: ${f}`);
    }
  }

  // 2. Sync .agents/skills/, .claude/skills/, docs/, and scripts/
  const dirSuites = ['.agents', '.claude', 'docs', 'scripts'];
  for (const dirName of dirSuites) {
    const s = path.join(sourceDir, dirName);
    const d = path.join(targetDir, dirName);
    if (fs.existsSync(s)) {
      copyRecursive(s, d);
      console.log(`  [+] Synced ${dirName}/ suite`);
    }
  }

  // 3. Inputs Structure (Figma, Client Docs, Screenshots, Semantic Modifications)
  const inputDirs = [
    path.join(targetDir, 'inputs', 'client_docs'),
    path.join(targetDir, 'inputs', 'client_comms'),
    path.join(targetDir, 'inputs', 'figma', 'tokens'),
    path.join(targetDir, 'inputs', 'figma', 'exports'),
    path.join(targetDir, 'inputs', 'screenshots'),
    path.join(targetDir, 'inputs', 'modifications', 'update_notes'),
    path.join(targetDir, 'inputs', 'modifications', 'telegram_chats'),
    path.join(targetDir, 'inputs', 'modifications', 'features'),
    path.join(targetDir, 'inputs', 'modifications', 'screenshots', 'ui_tweaks'),
    path.join(targetDir, 'inputs', 'modifications', 'screenshots', 'new_sections'),
    path.join(targetDir, 'inputs', 'modifications', 'screenshots', 'bug_fixes'),
    path.join(targetDir, 'frontend', 'public', 'images', 'hero'),
    path.join(targetDir, 'frontend', 'public', 'images', 'products'),
    path.join(targetDir, 'frontend', 'public', 'images', 'categories'),
    path.join(targetDir, 'frontend', 'public', 'images', 'gallery'),
    path.join(targetDir, 'frontend', 'public', 'images', 'features'),
    path.join(targetDir, 'frontend', 'public', 'images', 'anatomy'),
    path.join(targetDir, 'frontend', 'public', 'images', 'showroom'),
    path.join(targetDir, 'frontend', 'public', 'images', 'slices'),
  ];

  for (const dir of inputDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const inputFiles = [
    'inputs/references.md',
    'inputs/figma/README.md',
    'inputs/figma/figma_links.md',
    'inputs/client_docs/README.md',
    'inputs/client_docs/requirements.md',
    'inputs/client_docs/telegram_chat.txt',
    'inputs/client_docs/updates.md',
    'inputs/client_comms/README.md',
    'inputs/client_comms/incoming_message.md',
    'inputs/client_comms/reply_history.md',
    'inputs/modifications/README.md',
    'inputs/modifications/update_notes/updates.md',
    'inputs/modifications/update_notes/README.md',
    'inputs/modifications/telegram_chats/telegram_chat.txt',
    'inputs/modifications/telegram_chats/README.md',
    'inputs/modifications/screenshots/README.md',
  ];

  for (const item of inputFiles) {
    const s = path.join(sourceDir, item);
    const d = path.join(targetDir, item);
    if (fs.existsSync(s) && !fs.existsSync(d)) {
      fs.copyFileSync(s, d);
      console.log(`  [+] Initialized template: ${item}`);
    }
  }

  // 4. Planning & Memory Structure — initialize with clean 0% starting state
  // (Preserves any existing PROJECT_STATUS.md or planning/* files in the target project)
  const planningDst = path.join(targetDir, 'planning');
  const decisionsSrc = path.join(sourceDir, 'planning', 'decisions.md');
  const decisionsDst = path.join(planningDst, 'decisions.md');
  if (fs.existsSync(decisionsSrc) && !fs.existsSync(decisionsDst)) {
    fs.mkdirSync(planningDst, { recursive: true });
    fs.copyFileSync(decisionsSrc, decisionsDst);
    console.log(`  [+] Initialized planning/decisions.md`);
  }

  resetProjectState(targetDir, { overwriteExisting: false });
  console.log(`  [+] Initialized clean 0% planning & memory state (if not already present)`);
}

module.exports = { syncTo };
