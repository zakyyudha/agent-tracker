#!/usr/bin/env node
/**
 * Setup script for agent-tracker.
 * Copies the agent skill to <project-root>/.agents/skills/agent-tracker/
 * Configures <project-root>/AGENTS.md from templates/AGENTS.template.md
 * Initializes tracker environment (.env.local) and compiles CLI.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const TRACKER_DIR = path.resolve(__dirname, '..');
const TARGET_PROJECT_DIR =
  process.env.TARGET_PROJECT_DIR || path.resolve(TRACKER_DIR, '..');
const TRACKER_REL_PATH =
  path.relative(TARGET_PROJECT_DIR, TRACKER_DIR) || 'tracker';

console.log('🐴 Setting up agent-tracker...');
console.log(`- Tracker location : ${TRACKER_DIR}`);
console.log(`- Target project   : ${TARGET_PROJECT_DIR}`);
console.log(`- Tracker path     : ${TRACKER_REL_PATH}\n`);

// 1. Copy Skill to Target Project
const SKILL_SRC_DIR = path.join(TRACKER_DIR, 'skills', 'agent-tracker');
const SKILL_DEST_DIR = path.join(
  TARGET_PROJECT_DIR,
  '.agents',
  'skills',
  'agent-tracker',
);

if (fs.existsSync(SKILL_SRC_DIR)) {
  fs.mkdirSync(SKILL_DEST_DIR, { recursive: true });
  fs.cpSync(SKILL_SRC_DIR, SKILL_DEST_DIR, { recursive: true });
  console.log(`✓ Copied skill to: ${path.relative(TARGET_PROJECT_DIR, SKILL_DEST_DIR)}/`);
} else {
  console.warn(`⚠ Skill source not found at: ${SKILL_SRC_DIR}`);
}

// 2. Setup AGENTS.md in Target Project
const TEMPLATE_PATH = path.join(TRACKER_DIR, 'templates', 'AGENTS.template.md');
const TARGET_AGENTS_PATH = path.join(TARGET_PROJECT_DIR, 'AGENTS.md');

if (fs.existsSync(TEMPLATE_PATH)) {
  let templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  // Replace placeholder <tracker-dir> with actual relative directory
  templateContent = templateContent.replace(/<tracker-dir>/g, TRACKER_REL_PATH);

  if (!fs.existsSync(TARGET_AGENTS_PATH)) {
    fs.writeFileSync(TARGET_AGENTS_PATH, templateContent, 'utf8');
    console.log(`✓ Created new AGENTS.md at: ${path.relative(TARGET_PROJECT_DIR, TARGET_AGENTS_PATH)}`);
  } else {
    const existingContent = fs.readFileSync(TARGET_AGENTS_PATH, 'utf8');
    if (
      existingContent.includes('agent-tracker') ||
      existingContent.includes('The Agent Discipline Loop')
    ) {
      console.log(`ℹ AGENTS.md already contains agent-tracker instructions (skipping duplicate)`);
    } else {
      const merged = `${existingContent.trim()}\n\n---\n\n${templateContent.trim()}\n`;
      fs.writeFileSync(TARGET_AGENTS_PATH, merged, 'utf8');
      console.log(`✓ Appended agent-tracker instructions to existing AGENTS.md`);
    }
  }
} else {
  console.warn(`⚠ Template not found at: ${TEMPLATE_PATH}`);
}

// 3. Setup .env.local in Tracker
const ENV_LOCAL_PATH = path.join(TRACKER_DIR, '.env.local');
if (!fs.existsSync(ENV_LOCAL_PATH)) {
  const envContent = `# Database location (points to root kanban.db)\nTRACKER_DB=../kanban.db\n`;
  fs.writeFileSync(ENV_LOCAL_PATH, envContent, 'utf8');
  console.log(`✓ Created .env.local (TRACKER_DB=../kanban.db)`);
} else {
  console.log(`ℹ .env.local already exists`);
}

// 4. Precompile CLI
try {
  const buildScript = path.join(TRACKER_DIR, 'scripts', 'build-cli.cjs');
  if (fs.existsSync(buildScript)) {
    execSync(`node "${buildScript}"`, { cwd: TRACKER_DIR, stdio: 'pipe' });
    console.log(`✓ Pre-compiled CLI (dist/cli.mjs)`);
  }
} catch (err) {
  console.warn(`⚠ Failed to precompile CLI: ${err.message}`);
}

console.log('\n🎉 Setup completed successfully!');
console.log('Quick commands:');
console.log(`  node ${TRACKER_REL_PATH}/cli.mjs next          # Inspect frontier`);
console.log(`  node ${TRACKER_REL_PATH}/cli.mjs stats         # View status overview`);
console.log(`  cd ${TRACKER_REL_PATH} && pnpm start           # Run live realtime board\n`);
