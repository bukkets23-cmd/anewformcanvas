// Paste this entire file into Extensions -> Apps Script in your Google Sheet,
// replacing any placeholder code. Then Deploy -> New deployment -> Web app
// (Execute as: Me, Who has access: Anyone) and send the resulting URL back.

const SHEET_NAME = 'Registrations';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const payload = JSON.parse(e.postData.contents);
    const row = payload.row;
    const force = !!payload.force;
    const headers = Object.keys(row);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    const numCols = sheet.getLastColumn();
    const existingHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0];
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

    const values = existingHeaders.map(h => (row[h] !== undefined ? row[h] : ''));
    sheet.appendRow(values);

    return jsonOutput({ duplicate: duplicate, saved: true });
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
