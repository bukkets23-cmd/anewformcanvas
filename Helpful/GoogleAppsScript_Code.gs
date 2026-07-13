// Paste this entire file into Extensions -> Apps Script in your Google Sheet,
// replacing any placeholder code. Then Deploy -> New deployment -> Web app
// (Execute as: Me, Who has access: Anyone) and send the resulting URL back.
//
// Writes are targeted at SPREADSHEET_ID explicitly (rather than
// SpreadsheetApp.getActiveSpreadsheet()) so this works whether the script
// is bound to that Sheet or a standalone project — getActiveSpreadsheet()
// silently has nothing to attach to in a standalone project, which causes
// every submission to fail before a single header or row is ever written.
// Rows land on a tab named "Registrations", NOT the default "Sheet1" tab
// — check the tab list at the bottom of the spreadsheet if rows seem missing.

const SPREADSHEET_ID = '1xnQbzweYbNtChbNyD7ZJs0lJjhSWzUY6RhdVMy5rXOo';
const SHEET_NAME = 'Registrations';
const DUPLICATE_FLAG_HEADER = 'Duplicate Override';
const DUPLICATE_FLAG_COLOR = '#FFF3CD';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const payload = JSON.parse(e.postData.contents);
    const row = payload.row;
    const force = !!payload.force;

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(Object.keys(row).concat([DUPLICATE_FLAG_HEADER]));
    }

    let numCols = sheet.getLastColumn();
    let existingHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0];

    // One-time migration for sheets created before this column existed.
    if (existingHeaders.indexOf(DUPLICATE_FLAG_HEADER) === -1) {
      sheet.getRange(1, numCols + 1).setValue(DUPLICATE_FLAG_HEADER);
      existingHeaders = existingHeaders.concat([DUPLICATE_FLAG_HEADER]);
      numCols += 1;
    }

    const lastRow = sheet.getLastRow();
    const dataRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, numCols).getValues() : [];

    const nameIdx = existingHeaders.indexOf('First Name');
    const lastNameIdx = existingHeaders.indexOf('Last Name');
    const phoneIdx = existingHeaders.indexOf('Mobile Phone');
    const emailIdx = existingHeaders.indexOf('Personal Email');

    const newName = normalize(row['First Name'] + ' ' + row['Last Name']);
    const newPhone = normalizePhone(row['Mobile Phone']);
    const newEmail = normalize(row['Personal Email']);

    let duplicate = false;
    if (newName && newPhone && newEmail && nameIdx !== -1 && lastNameIdx !== -1 && phoneIdx !== -1 && emailIdx !== -1) {
      duplicate = dataRows.some(r => {
        const name = normalize(r[nameIdx] + ' ' + r[lastNameIdx]);
        const phone = normalizePhone(r[phoneIdx]);
        const email = normalize(r[emailIdx]);
        return name === newName && phone === newPhone && email === newEmail;
      });
    }

    if (duplicate && !force) {
      return jsonOutput({ duplicate: true, saved: false });
    }

    // Reaching here with duplicate === true means force === true (the
    // !force case already returned above) — i.e. the user clicked
    // "Submit anyway" on the warning modal. Flag and highlight that row
    // so it's visually distinct from ordinary, non-duplicate records.
    const values = existingHeaders.map(h => {
      if (h === DUPLICATE_FLAG_HEADER) return duplicate ? 'Yes - submitted despite duplicate warning' : '';
      return row[h] !== undefined ? row[h] : '';
    });
    sheet.appendRow(values);

    if (duplicate) {
      sheet.getRange(sheet.getLastRow(), 1, 1, numCols).setBackground(DUPLICATE_FLAG_COLOR);
    }

    return jsonOutput({ duplicate: duplicate, saved: true });
  } catch (err) {
    return jsonOutput({ error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function normalize(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhone(str) {
  return String(str || '').replace(/\D/g, '');
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
