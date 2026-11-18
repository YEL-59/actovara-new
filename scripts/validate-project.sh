#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  EasyTemplate v2.0 Universal Full-Stack Validation Suite "
echo "=========================================================="

FAILED=0

check_file() {
  if [ -f "$1" ]; then
    echo "  [OK] Found: $1"
  else
    echo "  [FAIL] MISSING: $1"
    FAILED=$((FAILED + 1))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo "  [OK] Found Directory: $1"
  else
    echo "  [FAIL] MISSING Directory: $1"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "1. Checking Core Framework & Agent Rules..."
check_file "AGENTS.md"
check_file "backend/AGENTS.md"
check_file "frontend/AGENTS.md"
check_file "frontend/DESIGN_GUIDELINES.md"
check_file "README.md"
check_file "HOW_TO_USE_BN.md"
check_file "HOW_TO_USE_EN.md"
check_file "PROJECT_STRUCTURE.md"
check_file "PROMPT_SHORTCUT.md"
check_file "project.config.md"
check_file "settings.json"

echo ""
echo "2. Checking Executable Agent Skills (.agents/skills/) & Blueprints (docs/)..."
check_file ".agents/skills/project-planning/SKILL.md"
check_file ".agents/skills/figma-to-fullstack/SKILL.md"
check_file ".agents/skills/backend-development/SKILL.md"
check_file ".agents/skills/frontend-development/SKILL.md"
check_file "docs/03-figma-analysis.md"
check_file "docs/04-design-system.md"
check_file "docs/06-backend-architecture.md"
check_file "docs/07-database-design.md"
check_file "docs/08-api-contract.md"
check_file "docs/09-error-handling-and-logging.md"
check_file "docs/10-security-plan.md"
check_file "docs/11-testing-strategy.md"
check_file "docs/12-deployment-and-devops.md"
check_file "docs/13-acceptance-criteria.md"
check_dir ".claude/skills"
check_file "scripts/new-project.js"
check_file ".github/workflows/ci.yml"

echo ""
echo "3. Checking Planning & Inputs Governance..."
check_file "inputs/figma/README.md"
check_file "inputs/figma/figma_links.md"
check_file "planning/MEMORY.md"
check_file "planning/task.md"
check_file "planning/updateplanning.md"
check_dir "planning/tasks"

echo ""
echo "4. Checking Universal Modular Backend Core & Domain Modules (backend/)..."
check_file "backend/package.json"
check_file "backend/tsconfig.json"
check_file "backend/prisma/schema.prisma"
check_file "backend/src/app.ts"
check_file "backend/src/server.ts"
check_file "backend/src/database/index.ts"
check_file "backend/src/database/seed.ts"
check_file "backend/src/modules/health/health.route.ts"
check_file "backend/src/modules/docs/openapi.spec.ts"
check_file "backend/src/modules/docs/docs.route.ts"
check_file "backend/src/modules/auth/user.model.ts"
check_file "backend/src/modules/auth/auth.route.ts"
check_file "backend/src/modules/category/category.model.ts"
check_file "backend/src/modules/category/category.route.ts"
check_file "backend/src/modules/item/item.model.ts"
check_file "backend/src/modules/item/item.route.ts"
check_file "backend/src/modules/order/order.model.ts"
check_file "backend/src/modules/order/order.route.ts"
check_file "backend/src/routes/index.ts"
check_file "backend/src/middlewares/globalErrorHandler.ts"
check_file "backend/src/utils/sendResponse.ts"

echo ""
echo "5. Checking Frontend Core, App Router Views & 6-State UI Primitives (frontend/)..."
check_file "frontend/package.json"
check_file "frontend/tsconfig.json"
check_file "frontend/src/app/page.tsx"
check_file "frontend/src/app/items/page.tsx"
check_file "frontend/src/app/items/[slug]/page.tsx"
check_file "frontend/src/app/dashboard/page.tsx"
check_file "frontend/src/app/layout.tsx"
check_file "frontend/src/app/globals.css"
check_file "frontend/src/components/layout/Navbar.tsx"
check_file "frontend/src/components/layout/Footer.tsx"
check_file "frontend/src/services/api.ts"
check_file "frontend/src/components/ui/index.ts"
check_file "frontend/src/components/ui/Button.tsx"
check_file "frontend/src/components/ui/Card.tsx"
check_file "frontend/src/components/ui/Input.tsx"
check_file "frontend/src/components/ui/Skeleton.tsx"
check_file "frontend/src/components/ui/EmptyState.tsx"
check_file "frontend/src/components/ui/Alert.tsx"
check_file "frontend/src/components/ui/Badge.tsx"
check_file "frontend/src/components/ui/Dialog.tsx"
check_file "frontend/src/components/ui/SpecTable.tsx"
check_file "frontend/src/components/ui/Tabs.tsx"
check_file "frontend/src/components/ui/Textarea.tsx"

echo ""
echo "6. Verifying Backend TypeScript Build..."
if [ -d "backend/node_modules" ]; then
  if (cd backend && npm run build); then
    echo "  [OK] Backend build compiled successfully with 0 errors!"
  else
    echo "  [FAIL] Backend build failed."
    FAILED=$((FAILED + 1))
  fi
else
  echo "  [FAIL] Missing backend/node_modules. Run 'npm run install:all' before validating."
  FAILED=$((FAILED + 1))
fi

echo ""
echo "7. Verifying Frontend Next.js Build..."
if [ -d "frontend/node_modules" ]; then
  if (cd frontend && npm run build); then
    echo "  [OK] Frontend build compiled successfully with 0 errors!"
  else
    echo "  [FAIL] Frontend build failed."
    FAILED=$((FAILED + 1))
  fi
else
  echo "  [FAIL] Missing frontend/node_modules. Run 'npm run install:all' before validating."
  FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================================="
if [ "$FAILED" -eq 0 ]; then
  echo "  SUCCESS: All EasyTemplate v2.0 components are healthy!"
  echo "=========================================================="
  exit 0
else
  echo "  FAILED: Encountered $FAILED issues. Please fix missing files."
  echo "=========================================================="
  exit 1
fi
