/**
 * =============================================================================
 * Google Apps Script: スプレッドシートCSV自動エクスポート
 * =============================================================================
 * 
 * 機能: スプレッドシートの特定タブをCSV形式でGoogle Driveに保存
 * 作成日: 2026-01-10
 * 
 * 使い方:
 * 1. 下記の設定セクションを編集
 * 2. exportSheetToCSV() を実行
 * 3. トリガー設定で自動実行（オプション）
 */

// =============================================================================
// 📝 設定セクション - ここを編集してください
// =============================================================================

const CONFIG = {
  // スプレッドシートID（URLの /d/ と /edit の間）
  // 例: https://docs.google.com/spreadsheets/d/XXXXX/edit → XXXXX がID
  SPREADSHEET_ID: '1WkBTJe7q7c6FhgX7CSYLKrJihwGP0KGFW2n813aLQt4',
  
  // エクスポートするシート（タブ）名
  // 複数シートをエクスポートする場合は配列で指定
  SHEET_NAME: 'トレードノートAI分析用',
  
  // 複数シートを指定する場合（exportMultipleSheets用）
  SHEET_NAMES: [
    'トレードノートAI分析用',
    // '別のシート名',
  ],
  
  // 保存先Google DriveフォルダID
  // 例: https://drive.google.com/drive/folders/XXXXX → XXXXX がID
  DRIVE_FOLDER_ID: '1s6zsardrkMpvbyx2YxAMSIjCEyjQTvQQ',
  
  // ファイル名設定
  FILE_PREFIX: 'FX_EntryLog',           // ファイル名のプレフィックス
  INCLUDE_DATE: true,                    // ファイル名に日付を含める
  DATE_FORMAT: 'yyyyMMdd_HHmmss',        // 日付フォーマット
  
  // 動作設定
  DELETE_OLD_FILES: true,                // エクスポート前に古いCSVを削除（1ファイルのみ保持）
  OVERWRITE_EXISTING: false,             // 同名ファイルを上書きするか（DELETE_OLD_FILESがtrueの場合は無視）
  NOTIFY_EMAIL: '',                      // 完了通知メール（空欄で通知なし）
};

// =============================================================================
// 📊 メイン関数
// =============================================================================

/**
 * メイン関数: 設定されたシートをCSVとしてエクスポート
 * トリガー設定やメニューからはこの関数を呼び出す
 */
function exportSheetToCSV() {
  try {
    const result = exportSheet(CONFIG.SHEET_NAME);
    Logger.log(`✅ エクスポート成功: ${result.fileName}`);
    Logger.log(`📁 保存先: ${result.fileUrl}`);
    
    // メール通知（設定されている場合）
    if (CONFIG.NOTIFY_EMAIL) {
      sendNotificationEmail(result);
    }
    
    return result;
  } catch (error) {
    Logger.log(`❌ エクスポート失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 複数シートを一括エクスポート
 */
function exportMultipleSheets() {
  const results = [];
  
  for (const sheetName of CONFIG.SHEET_NAMES) {
    try {
      const result = exportSheet(sheetName);
      results.push({ sheetName, success: true, result });
      Logger.log(`✅ ${sheetName}: エクスポート成功`);
    } catch (error) {
      results.push({ sheetName, success: false, error: error.message });
      Logger.log(`❌ ${sheetName}: エクスポート失敗 - ${error.message}`);
    }
  }
  
  return results;
}

/**
 * カスタムファイル名でエクスポート
 * @param {string} customFileName - カスタムファイル名（拡張子なし）
 */
function exportWithCustomName(customFileName) {
  return exportSheet(CONFIG.SHEET_NAME, customFileName);
}

// =============================================================================
// 🔧 内部関数
// =============================================================================

/**
 * シートをCSVとしてエクスポート
 * @param {string} sheetName - エクスポートするシート名
 * @param {string} customFileName - カスタムファイル名（オプション）
 * @returns {Object} エクスポート結果
 */
function exportSheet(sheetName, customFileName = null) {
  // スプレッドシートを取得
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  if (!spreadsheet) {
    throw new Error(`スプレッドシートが見つかりません: ${CONFIG.SPREADSHEET_ID}`);
  }
  
  // シートを取得
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`シートが見つかりません: ${sheetName}`);
  }
  
  // データを取得
  const data = sheet.getDataRange().getValues();
  
  // CSVに変換
  const csvContent = convertToCSV(data);
  
  // ファイル名を生成
  const fileName = customFileName || generateFileName(sheetName);
  
  // Google Driveに保存
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  if (!folder) {
    throw new Error(`フォルダが見つかりません: ${CONFIG.DRIVE_FOLDER_ID}`);
  }
  
  // 古いCSVファイルを削除（1ファイルのみ保持する場合）
  if (CONFIG.DELETE_OLD_FILES) {
    const deletedCount = deleteOldCSVFiles(folder);
    if (deletedCount > 0) {
      Logger.log(`🗑️ 古いCSVファイルを ${deletedCount} 件削除しました`);
    }
  } else if (CONFIG.OVERWRITE_EXISTING) {
    // 同名ファイルのみ削除
    const existingFiles = folder.getFilesByName(fileName + '.csv');
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
  }
  
  // CSVファイルを作成
  const blob = Utilities.newBlob(csvContent, 'text/csv', fileName + '.csv');
  const file = folder.createFile(blob);
  
  return {
    fileName: fileName + '.csv',
    fileUrl: file.getUrl(),
    fileId: file.getId(),
    sheetName: sheetName,
    rowCount: data.length,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * 2次元配列をCSV文字列に変換
 * @param {Array[]} data - シートのデータ（2次元配列）
 * @returns {string} CSV形式の文字列
 */
function convertToCSV(data) {
  return data.map(row => {
    return row.map(cell => {
      // セルの値を文字列に変換
      let value = cell === null || cell === undefined ? '' : String(cell);
      
      // 日付オブジェクトの処理
      if (cell instanceof Date) {
        value = Utilities.formatDate(cell, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss');
      }
      
      // CSVエスケープ処理
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    }).join(',');
  }).join('\r\n');
}

/**
 * ファイル名を生成
 * @param {string} sheetName - シート名
 * @returns {string} ファイル名（拡張子なし）
 */
function generateFileName(sheetName) {
  let fileName = CONFIG.FILE_PREFIX || sheetName;
  
  // シート名をファイル名に含める場合
  if (CONFIG.FILE_PREFIX && CONFIG.FILE_PREFIX !== sheetName) {
    fileName = `${CONFIG.FILE_PREFIX}_${sanitizeFileName(sheetName)}`;
  }
  
  // 日付を追加
  if (CONFIG.INCLUDE_DATE) {
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), CONFIG.DATE_FORMAT);
    fileName = `${fileName}_${dateStr}`;
  }
  
  return fileName;
}

/**
 * ファイル名に使用できない文字を置換
 * @param {string} name - 元の名前
 * @returns {string} サニタイズされた名前
 */
function sanitizeFileName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '_');
}

/**
 * 完了通知メールを送信
 * @param {Object} result - エクスポート結果
 */
function sendNotificationEmail(result) {
  const subject = `[GAS] CSVエクスポート完了: ${result.fileName}`;
  const body = `
CSVエクスポートが完了しました。

📁 ファイル名: ${result.fileName}
📊 シート名: ${result.sheetName}
📈 行数: ${result.rowCount}
🕐 実行日時: ${result.exportedAt}
🔗 ファイルURL: ${result.fileUrl}
`;
  
  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, body);
}

/**
 * フォルダ内の全CSVファイルを削除
 * @param {Folder} folder - 対象フォルダ
 * @returns {number} 削除したファイル数
 */
function deleteOldCSVFiles(folder) {
  const files = folder.getFilesByType(MimeType.CSV);
  let deletedCount = 0;
  
  while (files.hasNext()) {
    const file = files.next();
    Logger.log(`🗑️ 削除: ${file.getName()}`);
    file.setTrashed(true);
    deletedCount++;
  }
  
  return deletedCount;
}

// =============================================================================
// 📋 ユーティリティ関数
// =============================================================================

/**
 * 最新のエクスポート情報を取得
 */
function getLatestExportInfo() {
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const files = folder.getFilesByType(MimeType.CSV);
  
  let latestFile = null;
  let latestDate = new Date(0);
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getDateCreated() > latestDate) {
      latestDate = file.getDateCreated();
      latestFile = file;
    }
  }
  
  if (latestFile) {
    return {
      fileName: latestFile.getName(),
      fileUrl: latestFile.getUrl(),
      createdAt: latestDate.toISOString(),
    };
  }
  
  return null;
}

/**
 * 設定内容をログに出力（デバッグ用）
 */
function logConfig() {
  Logger.log('=== 現在の設定 ===');
  Logger.log(`スプレッドシートID: ${CONFIG.SPREADSHEET_ID}`);
  Logger.log(`シート名: ${CONFIG.SHEET_NAME}`);
  Logger.log(`保存先フォルダID: ${CONFIG.DRIVE_FOLDER_ID}`);
  Logger.log(`ファイルプレフィックス: ${CONFIG.FILE_PREFIX}`);
  Logger.log(`日付を含める: ${CONFIG.INCLUDE_DATE}`);
  Logger.log(`上書き: ${CONFIG.OVERWRITE_EXISTING}`);
}

/**
 * テスト実行（ドライラン）
 * 実際にファイルは作成せず、設定の確認のみ
 */
function testExport() {
  try {
    // スプレッドシートの確認
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log(`✅ スプレッドシート: ${spreadsheet.getName()}`);
    
    // シートの確認
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    if (sheet) {
      Logger.log(`✅ シート: ${CONFIG.SHEET_NAME} (${sheet.getLastRow()}行)`);
    } else {
      Logger.log(`❌ シートが見つかりません: ${CONFIG.SHEET_NAME}`);
      // 利用可能なシート一覧を表示
      const sheets = spreadsheet.getSheets();
      Logger.log('利用可能なシート:');
      sheets.forEach(s => Logger.log(`  - ${s.getName()}`));
    }
    
    // フォルダの確認
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log(`✅ 保存先フォルダ: ${folder.getName()}`);
    
    // ファイル名の確認
    const fileName = generateFileName(CONFIG.SHEET_NAME);
    Logger.log(`📝 生成されるファイル名: ${fileName}.csv`);
    
    Logger.log('=== テスト完了 ===');
  } catch (error) {
    Logger.log(`❌ テスト失敗: ${error.message}`);
  }
}

// =============================================================================
// 📌 スプレッドシートメニュー追加（オプション）
// =============================================================================

/**
 * スプレッドシートを開いたときにカスタムメニューを追加
 * ※この関数はスプレッドシートにバインドされたスクリプトでのみ動作
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('CSVエクスポート')
    .addItem('今すぐエクスポート', 'exportSheetToCSV')
    .addItem('複数シートをエクスポート', 'exportMultipleSheets')
    .addSeparator()
    .addItem('設定を確認', 'logConfig')
    .addItem('テスト実行', 'testExport')
    .addToUi();
}
