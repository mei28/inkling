default: build

build:
    pnpm run build

watch:
    pnpm run dev

test *args:
    pnpm vitest run {{args}}

test-watch *args:
    pnpm vitest {{args}}

lint:
    pnpm run lint

fmt:
    pnpm run fmt

typecheck:
    pnpm run typecheck

check: lint typecheck test

# Serve demo page on localhost for testing
serve port="3000":
    python3 -m http.server {{port}} -d public/fixtures

# Create zip for Chrome Web Store submission
package: build
    rm -f inkling.zip
    cd dist && zip -r ../inkling.zip .
