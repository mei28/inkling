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
