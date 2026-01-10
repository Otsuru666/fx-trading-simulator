# Google Apps Script: スプレッドシートCSV自動エクスポート

## 📋 概要

スプレッドシートの特定タブをCSV形式でGoogle Driveの指定フォルダに自動保存するGASスクリプト。

## 🎯 ユースケース

- FXエントリーログをAI分析用にCSVエクスポート
- 定期的なデータバックアップ
- 複数タブの一括エクスポート

---

## ⚙️ 設定項目

### 必須設定

| 項目 | 説明 | 例 |
|------|------|-----|
| `SPREADSHEET_ID` | スプレッドシートのID | URLの `/d/` と `/edit` の間の文字列 |
| `SHEET_NAME` | エクスポートするタブ名 | `"トレードノートAI分析用"` |
| `DRIVE_FOLDER_ID` | 保存先Google DriveフォルダのID | URLの最後の部分 |

### オプション設定

| 項目 | 説明 | デフォルト |
|------|------|-----|
| `FILE_PREFIX` | ファイル名のプレフィックス | `"FX_EntryLog"` |
| `INCLUDE_DATE` | ファイル名に日付を含める | `true` |
| `DELETE_OLD_FILES` | エクスポート前に古いCSVを全削除（1ファイルのみ保持） | `true` |
| `OVERWRITE_EXISTING` | 同名ファイルを上書き（DELETE_OLD_FILESがfalseの時のみ有効） | `false` |

---

## 📝 ID取得方法

### スプレッドシートID

```
URL: https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit#gid=0
                                            ↑ここがID
```

### Google DriveフォルダID

```
URL: https://drive.google.com/drive/folders/1XYZ789abc...
                                            ↑ここがID
```

---

## 🚀 セットアップ手順

### 1. GASプロジェクト作成

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を設定（例: `SpreadsheetCSVExporter`）

### 2. コードを貼り付け

1. `コード.gs` の内容を削除
2. `GAS_SpreadsheetToCSV.gs` のコードを貼り付け
3. **設定セクションを編集**（スプレッドシートID、タブ名、フォルダID）

### 3. 権限の承認

1. 「実行」ボタンをクリック
2. 「権限を確認」をクリック
3. Googleアカウントを選択
4. 「詳細」→「（プロジェクト名）に移動」をクリック
5. 「許可」をクリック

### 4. トリガー設定（自動実行）

1. 左メニューの「トリガー」（時計アイコン）をクリック
2. 「トリガーを追加」をクリック
3. 設定：
   - 実行する関数: `exportSheetToCSV`
   - イベントのソース: `時間主導型`
   - 時間ベースのトリガーのタイプ: `日付ベースのタイマー` or `週ベースのタイマー`
   - 時刻: 任意（例: 午前6時〜7時）
4. 「保存」をクリック

---

## 🔧 ローカル同期設定

### Google Drive Desktop を使用

1. [Google Drive Desktop](https://www.google.com/drive/download/) をインストール
2. 設定で「マイドライブをこのパソコンに同期」を選択
3. CSVエクスポート先フォルダを同期対象に含める

### 同期先パス例

```
Mac: ~/Google Drive/My Drive/FX_TradeLog/
  ↓ シンボリックリンク作成
~/Desktop/github/private-warehouse/1.FX/8.トレードlog/
```

シンボリックリンク作成コマンド:
```bash
ln -s "/Users/nakato/Google Drive/My Drive/FX_TradeLog" "/Users/nakato/Desktop/github/private-warehouse/1.FX/8.トレードlog/GoogleDrive"
```

---

## 📊 機能一覧

| 関数名 | 説明 |
|--------|------|
| `exportSheetToCSV()` | 設定されたシートをCSVエクスポート（メイン関数） |
| `exportMultipleSheets()` | 複数シートを一括エクスポート |
| `exportWithCustomName(fileName)` | カスタムファイル名でエクスポート |
| `getLatestExportInfo()` | 最新エクスポート情報を取得 |

---

## ⚠️ 注意事項

1. **権限**: スプレッドシートとDriveへのアクセス権限が必要
2. **クォータ**: GASの実行時間制限（6分/実行）に注意
3. **ファイルサイズ**: 大きなシートは分割を検討
4. **タブ名**: 日本語OK、スペースも可

---

## 🔍 トラブルシューティング

### エラー: "スプレッドシートが見つかりません"
- `SPREADSHEET_ID` が正しいか確認
- スプレッドシートへのアクセス権限があるか確認

### エラー: "シートが見つかりません"  
- `SHEET_NAME` がタブ名と完全一致しているか確認
- スペースや全角/半角の違いに注意

### エラー: "フォルダへのアクセスが拒否されました"
- `DRIVE_FOLDER_ID` が正しいか確認
- フォルダへのアクセス権限があるか確認

---

## 📅 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-10 | 初版作成 |

