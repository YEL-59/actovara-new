$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  EasyTemplate v2.0 Universal Full-Stack Validation Suite " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$failed = 0

function Check-FileExists($path) {
    if (Test-Path -LiteralPath $path) {
        Write-Host "  [OK] Found: $path" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Missing: $path" -ForegroundColor Red
        $script:failed++
    }
}

function Check-DirExists($path) {
    if (Test-Path -LiteralPath $path) {
        Write-Host "  [OK] Found Directory: $path" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Missing Directory: $path" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "`n1. Checking Core Framework & Agent Rules..." -ForegroundColor Yellow
Check-FileExists "AGENTS.md"
Check-FileExists "backend/AGENTS.md"
Check-FileExists "frontend/AGENTS.md"
Check-FileExists "frontend/DESIGN_GUIDELINES.md"
Check-FileExists "README.md"
Check-FileExists "HOW_TO_USE_BN.md"
Check-FileExists "HOW_TO_USE_EN.md"
Check-FileExists "PROJECT_STRUCTURE.md"
Check-FileExists "PROMPT_SHORTCUT.md"
Check-FileExists "project.config.md"
Check-FileExists "settings.json"

Write-Host "`n2. Checking Executable Agent Skills (.agents/skills/) & Blueprints (docs/)..." -ForegroundColor Yellow
Check-FileExists ".agents/skills/project-planning/SKILL.md"
Check-FileExists ".agents/skills/figma-to-fullstack/SKILL.md"
Check-FileExists ".agents/skills/design-system/SKILL.md"
Check-FileExists ".agents/skills/frontend-development/SKILL.md"
Check-FileExists ".agents/skills/backend-development/SKILL.md"
Check-FileExists ".agents/skills/api-contract-validation/SKILL.md"
Check-FileExists ".agents/skills/task-execution/SKILL.md"
Check-FileExists ".agents/skills/client-modification/SKILL.md"
Check-FileExists ".agents/skills/client-communication/SKILL.md"
Check-FileExists ".agents/skills/testing/SKILL.md"
Check-FileExists "docs/03-figma-analysis.md"
Check-FileExists "docs/04-design-system.md"
Check-FileExists "docs/06-backend-architecture.md"
Check-FileExists "docs/07-database-design.md"
Check-FileExists "docs/08-api-contract.md"
Check-FileExists "docs/09-error-handling-and-logging.md"
Check-FileExists "docs/10-security-plan.md"
Check-FileExists "docs/11-testing-strategy.md"
Check-FileExists "docs/12-deployment-and-devops.md"
Check-FileExists "docs/13-acceptance-criteria.md"
Check-FileExists "docs/context-map.md"
Check-DirExists ".claude/skills"

Write-Host "`n3. Checking Client Inputs, Figma Dropzone, Comms & Planning Governance..." -ForegroundColor Yellow
Check-FileExists "inputs/figma/README.md"
Check-FileExists "inputs/figma/figma_links.md"
Check-FileExists "inputs/client_comms/README.md"
Check-FileExists "inputs/client_comms/incoming_message.md"
Check-FileExists "inputs/client_comms/reply_history.md"
Check-FileExists "scripts/parse-inputs.js"
Check-FileExists "scripts/client-reply.js"
Check-FileExists "scripts/new-project.js"
Check-FileExists ".github/workflows/ci.yml"
Check-FileExists "planning/MEMORY.md"
Check-FileExists "planning/task.md"
Check-FileExists "planning/updateplanning.md"
Check-FileExists "planning/open-questions.md"
Check-FileExists "planning/decisions.md"
Check-DirExists "planning/tasks"

Write-Host "`n4. Checking Universal Modular Backend Core & Domain Modules (backend/)..." -ForegroundColor Yellow
Check-FileExists "backend/package.json"
Check-FileExists "backend/tsconfig.json"
Check-FileExists "backend/prisma/schema.prisma"
Check-FileExists "backend/src/app.ts"
Check-FileExists "backend/src/server.ts"
Check-FileExists "backend/src/database/index.ts"
Check-FileExists "backend/src/database/seed.ts"
Check-FileExists "backend/src/modules/health/health.route.ts"
Check-FileExists "backend/src/modules/docs/openapi.spec.ts"
Check-FileExists "backend/src/modules/docs/docs.route.ts"
Check-FileExists "backend/src/modules/auth/user.model.ts"
Check-FileExists "backend/src/modules/auth/auth.route.ts"
Check-FileExists "backend/src/modules/category/category.model.ts"
Check-FileExists "backend/src/modules/category/category.route.ts"
Check-FileExists "backend/src/modules/item/item.model.ts"
Check-FileExists "backend/src/modules/item/item.route.ts"
Check-FileExists "backend/src/modules/order/order.model.ts"
Check-FileExists "backend/src/modules/order/order.route.ts"
Check-FileExists "backend/src/routes/index.ts"
Check-FileExists "backend/src/middlewares/globalErrorHandler.ts"
Check-FileExists "backend/src/utils/sendResponse.ts"

Write-Host "`n5. Checking Frontend Core, App Router Views & 6-State UI Primitives (frontend/)..." -ForegroundColor Yellow
Check-FileExists "frontend/package.json"
Check-FileExists "frontend/tsconfig.json"
Check-FileExists "frontend/src/app/page.tsx"
Check-FileExists "frontend/src/app/items/page.tsx"
Check-FileExists "frontend/src/app/items/[slug]/page.tsx"
Check-FileExists "frontend/src/app/dashboard/page.tsx"
Check-FileExists "frontend/src/app/layout.tsx"
Check-FileExists "frontend/src/app/globals.css"
Check-FileExists "frontend/src/components/layout/Navbar.tsx"
Check-FileExists "frontend/src/components/layout/Footer.tsx"
Check-FileExists "frontend/src/services/api.ts"
Check-FileExists "frontend/src/components/ui/index.ts"
Check-FileExists "frontend/src/components/ui/Button.tsx"
Check-FileExists "frontend/src/components/ui/Card.tsx"
Check-FileExists "frontend/src/components/ui/Input.tsx"
Check-FileExists "frontend/src/components/ui/Skeleton.tsx"
Check-FileExists "frontend/src/components/ui/EmptyState.tsx"
Check-FileExists "frontend/src/components/ui/Alert.tsx"
Check-FileExists "frontend/src/components/ui/Badge.tsx"
Check-FileExists "frontend/src/components/ui/Dialog.tsx"
Check-FileExists "frontend/src/components/ui/SpecTable.tsx"
Check-FileExists "frontend/src/components/ui/Tabs.tsx"
Check-FileExists "frontend/src/components/ui/Textarea.tsx"

Write-Host "`n6. Verifying Backend TypeScript Build..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Push-Location "backend"
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Backend build compiled successfully with 0 errors!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Backend build failed." -ForegroundColor Red
        $failed++
    }
    Pop-Location
} else {
    Write-Host "  [FAIL] Missing backend/node_modules. Run 'npm run install:all' before validating." -ForegroundColor Red
    $failed++
}

Write-Host "`n7. Verifying Frontend Next.js Build..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Push-Location "frontend"
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Frontend build compiled successfully with 0 errors!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Frontend build failed." -ForegroundColor Red
        $failed++
    }
    Pop-Location
} else {
    Write-Host "  [FAIL] Missing frontend/node_modules. Run 'npm run install:all' before validating." -ForegroundColor Red
    $failed++
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($failed -eq 0) {
    Write-Host "  SUCCESS: All EasyTemplate v2.0 components are healthy!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "  FAILED: Encountered $failed issues. Please review above." -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 1
}
