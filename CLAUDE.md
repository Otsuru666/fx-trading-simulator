# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

FX収益シミュレーター：Fintokei攻略用のWebアプリケーション。トレードパラメータを入力すると、モンテカルロ法により合格までの日数・成功率を予測する。

- **デプロイ**: GitHub Pages（自動デプロイ）
- **URL**: https://otsuru666.github.io/fx-trading-simulator/
- **技術スタック**: Vue.js 3 (CDN) + Tailwind CSS (CDN) + Chart.js (CDN)
- **単一ファイル構成**: `index.html`のみ（ビルド不要）

## アーキテクチャ

### シングルファイルアーキテクチャ

`index.html`に全てが含まれる：
- HTML構造（タブナビゲーション: シミュレーション / トレード実績）
- CSS（CSS Variables + Tailwind）
- JavaScript（Vue.js Composition API）

### Vue.js状態管理

**reactive/ref:**
- `params`: シミュレーションパラメータ（口座資金、リスク率、勝率など）
- `simulation`: 資産推移シミュレーション結果
- `tradeData`: CSV読込トレード実績データ
- `activeTab`: タブ切替状態

**computed:**
- `calculated`: 月間収益・期待値・プロフィットファクターなど
- `fintokeiMonte`: Fintokeiモンテカルロシミュレーション結果（成功率、日数予測）
- `tradeStats`: トレード実績の統計（勝率、通貨ペア別成績）

### モンテカルロシミュレーション

**`runFintokeiPhase(targetPercent, iterations=500)`**:
- Fintokeiフェーズ1（+8%目標）、フェーズ2（+6%目標）の合格シミュレーション
- 500回試行で統計的に安定した結果を提供（成功率20%以上で十分）
- 現実的要素を含む：
  - スプレッドコスト（固定0.4 pips ≈ 0.004%）
  - 手数料（往復6ドル ≈ 0.006%）
  - スリッページ（0.01-0.02%ランダム）
  - 連敗時の心理的影響（リスク微増モデル: 連敗1回ごとに+5%、最大+30%）
- 失格ルール：
  - 1日最大損失 -5%
  - 累計損失 -10%
  - 最低3日間取引

## 開発ワークフロー

### ローカル開発

```bash
# HTTPサーバー起動
python3 -m http.server 8080

# ブラウザで確認
open http://localhost:8080/index.html
```

### デプロイ

```bash
# 変更をコミット＆プッシュ
git add index.html
git commit -m "機能追加: XXX"
git push origin main

# GitHub Pagesに自動反映（1-2分）
```

### Git運用ルール

- ブランチ: `main`のみ（直接プッシュ）
- コミットメッセージ: 日本語OK、末尾に `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- プッシュ後、GitHub Pagesの反映を1-2分待つ

## トレード実績機能（CSV読込）

### CSVデータソース

Google Spreadsheetから自動エクスポート:
- **GASスクリプト**: `GAS_SpreadsheetToCSV.gs`
- **エクスポート先**: Google Drive（Google Drive Desktopで同期）
- **CSVフォーマット**: 日付, エントリー時間, 決済時間, 取引通貨, シナリオスケール, エントリースケール, 結果（利確/損切り/建値撤退）, etc.

### CSV読込実装

- ドラッグ&ドロップまたはファイル選択
- `parseCSV()`: CSVパース（ダブルクォート対応）
- `tradeStats` computed: 統計集計（勝率、通貨ペア別、シナリオ別）

## 重要な設定値

### Fintokei攻略推奨パラメータ

- **リスク率**: 0.8%（連敗しても失格回避）
- **リスクリワード**: 1.1-1.2
- **勝率**: 62.5%（純粋勝率、建値除く）
- **建値撤退率**: 40%

### コスト設定（現実的要素）

```javascript
const spreadCost = 0.004;       // 0.4 pips固定
const commissionCost = 0.006;   // 往復6ドル
```

## コードの修正時の注意

### Vue.jsリアクティブシステム

- `params`の変更は自動的に`calculated`と`fintokeiMonte`を再計算
- `watch()`でパラメータ変更時に自動シミュレーション実行
- Chart.js更新は`updateChart()`で明示的に実行

### モンテカルロシミュレーション変更時

- `runFintokeiPhase()`内のコスト計算・失格ルールを変更
- 試行回数変更は不要（500回で統計的に十分）
- 新しい現実的要素を追加する場合は「シミュレーション精度」注記も更新

### UI変更時

- CSS Variables (`--bg-primary`, `--accent-blue`など) を活用
- Tailwind CDN使用（カスタムクラス不可）
- ダークテーマ前提のデザイン

## Google Apps Script連携

**GAS設定ファイル**: `GAS_SpreadsheetToCSV.gs`

- スプレッドシートIDとフォルダIDを環境に合わせて設定
- `exportSheetToCSV()`を定期実行トリガーで自動化
- 詳細は`GAS_SpreadsheetToCSV.md`参照
