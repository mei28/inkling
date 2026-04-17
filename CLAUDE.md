# inkling — Chrome Extension

Web ページ上のカラーコード（hex, rgb, hsl）をその色でハイライト表示する Chrome 拡張機能。

## Conventions

- TypeScript strict mode。`any` 禁止（やむを得ない場合はコメントで理由）
- 公開関数には JSDoc、引数と返り値の型はすべて明示
- DOM API を直接叩くのは `src/content/*` 配下のみ。`src/shared/*` は pure function
- テストは AAA パターン（Arrange/Act/Assert）で書く
- `data-inkling` を名前空間として使用（CSS 変数: `--inkling-*`）

## Commands

- `just build` — esbuild で production ビルド → dist/
- `just watch` — esbuild watch モード
- `just test` — vitest run
- `just lint` — biome check
- `just fmt` — biome check --write
- `just typecheck` — tsc --noEmit
- `just check` — lint + typecheck + test を一括実行

## Architecture

- `src/content/` — content script（DOM 操作はここだけ）
- `src/background/` — service worker（storage と messaging の橋渡し）
- `src/popup/` — popup UI
- `src/shared/` — pure function のみ（型定義、定数、ユーティリティ）
- `static/` — manifest.json, HTML, CSS（ビルド時に dist/ へコピー）
- `test/` — vitest テスト
