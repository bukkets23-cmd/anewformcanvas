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
//
// Resume files are saved to Google Drive (folder below) and a clickable link
// is written to the "Resume Link" column. Progressive saves update the same
// row (matched by "Submission ID") as the candidate advances through pages.

const SPREADSHEET_ID = '1xnQbzweYbNtChbNyD7ZJs0lJjhSWzUY6RhdVMy5rXOo';
const SHEET_NAME = 'Registrations';
const RESUMES_FOLDER_NAME = 'GCSP Resume Uploads';
const DUPLICATE_FLAG_HEADER = 'Duplicate Override';
const SUBMISSION_ID_HEADER = 'Submission ID';
const COMPLETION_STATUS_HEADER = 'Completion Status';
const RESUME_LINK_HEADER = 'Resume Link';
const RESUME_FILENAME_HEADER = 'Resume Filename';
const DUPLICATE_FLAG_COLOR = '#FFF3CD';
const IN_PROGRESS_COLOR = '#E8F4FD';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const payload = JSON.parse(e.postData.contents);
    const incomingRow = payload.row || {};
    const force = !!payload.force;
    let submissionId = String(payload.submissionId || incomingRow[SUBMISSION_ID_HEADER] || '').trim();
    const resumeFile = payload.resumeFile;

    ensureHeaders_(sheet, incomingRow);

    const numCols = sheet.getLastColumn();
    const existingHeaders = sheet.getRange(1, 1, 1, numCols).getValues()[0];
    const submissionIdIdx = existingHeaders.indexOf(SUBMISSION_ID_HEADER);

    if (!submissionId) {
      submissionId = Utilities.getUuid();
    }

    const lastRow = sheet.getLastRow();
    const dataRowCount = Math.max(0, lastRow - 1);
    const dataRows = dataRowCount
      ? sheet.getRange(2, 1, lastRow, numCols).getValues()
      : [];

    let targetRowIndex = findSubmissionRowIndex_(dataRows, existingHeaders, submissionId);

    const mergedRow = targetRowIndex === -1
      ? {}
      : rowObjectFromSheetRow_(existingHeaders, dataRows[targetRowIndex]);

    Object.keys(incomingRow).forEach(function (key) {
      const val = incomingRow[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        mergedRow[key] = val;
      }
    });

    mergedRow[SUBMISSION_ID_HEADER] = submissionId;

    if (resumeFile && resumeFile.data) {
      const resumeMeta = saveResumeToDrive_(resumeFile, submissionId);
      mergedRow[RESUME_LINK_HEADER] = resumeMeta.url;
      mergedRow[RESUME_FILENAME_HEADER] = resumeMeta.name;
    }

    const duplicate = targetRowIndex === -1 && isDuplicateSubmission_(mergedRow, dataRows, existingHeaders);

    if (duplicate && !force) {
      return jsonOutput({ duplicate: true, saved: false, submissionId: submissionId });
    }

    if (duplicate) {
      mergedRow[DUPLICATE_FLAG_HEADER] = 'Yes - submitted despite duplicate warning';
    } else if (!mergedRow[DUPLICATE_FLAG_HEADER]) {
      mergedRow[DUPLICATE_FLAG_HEADER] = '';
    }

    const values = existingHeaders.map(function (h) {
      return mergedRow[h] !== undefined ? mergedRow[h] : '';
    });

    if (targetRowIndex === -1) {
      sheet.appendRow(values);
      highlightRow_(sheet, sheet.getLastRow(), numCols, duplicate ? DUPLICATE_FLAG_COLOR : IN_PROGRESS_COLOR);
    } else {
      const sheetRowNumber = targetRowIndex + 2;
      sheet.getRange(sheetRowNumber, 1, 1, numCols).setValues([values]);
      const status = String(mergedRow[COMPLETION_STATUS_HEADER] || '');
      const bg = duplicate
        ? DUPLICATE_FLAG_COLOR
        : (status === 'Complete' ? null : IN_PROGRESS_COLOR);
      highlightRow_(sheet, sheetRowNumber, numCols, bg);
    }

    return jsonOutput({
      duplicate: duplicate,
      saved: true,
      submissionId: submissionId,
      updated: targetRowIndex !== -1,
    });
  } catch (err) {
    return jsonOutput({ error: String(err && err.message || err), saved: false });
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet, incomingRow) {
  const reserved = [
    SUBMISSION_ID_HEADER,
    COMPLETION_STATUS_HEADER,
    RESUME_LINK_HEADER,
    RESUME_FILENAME_HEADER,
    DUPLICATE_FLAG_HEADER,
  ];

  if (sheet.getLastRow() === 0) {
    const initial = reserved.concat(Object.keys(incomingRow));
    sheet.appendRow(uniqueHeaders_(initial));
    return;
  }

  const numCols = sheet.getLastColumn();
  let headers = sheet.getRange(1, 1, 1, numCols).getValues()[0];
  const toAdd = reserved.concat(Object.keys(incomingRow)).filter(function (h) {
    return h && headers.indexOf(h) === -1;
  });

  if (toAdd.length) {
    sheet.getRange(1, numCols + 1, 1, toAdd.length).setValues([toAdd]);
  }
}

function uniqueHeaders_(headers) {
  const seen = {};
  return headers.filter(function (h) {
    if (!h || seen[h]) return false;
    seen[h] = true;
    return true;
  });
}

function findSubmissionRowIndex_(dataRows, headers, submissionId) {
  const idx = headers.indexOf(SUBMISSION_ID_HEADER);
  if (idx === -1 || !submissionId) return -1;

  for (var i = 0; i < dataRows.length; i++) {
    if (String(dataRows[i][idx] || '').trim() === submissionId) {
      return i;
    }
  }
  return -1;
}

function rowObjectFromSheetRow_(headers, rowValues) {
  const obj = {};
  headers.forEach(function (h, i) {
    if (h) obj[h] = rowValues[i];
  });
  return obj;
}

// Registration's row has First Name/Last Name/Mobile Phone/Personal Email.
// A Form 1-only row (nobody has reached Registration yet) only has these
// "Website Resume Drop - ..." columns instead, so fall back to them when the
// canonical fields are blank — otherwise two Form-1-only submissions from the
// same person could never be recognized as duplicates of each other.
function duplicateKey_(row) {
  const name = normalize(
    (row['First Name'] || row['Last Name'])
      ? (row['First Name'] || '') + ' ' + (row['Last Name'] || '')
      : (row['Website Resume Drop - Full Name'] || '')
  );
  const phone = normalizePhone(row['Mobile Phone'] || row['Website Resume Drop - Phone']);
  const email = normalize(row['Personal Email'] || row['Website Resume Drop - Email']);

  if (!name || !phone || !email) return '';
  return name + '|' + phone + '|' + email;
}

function isDuplicateSubmission_(row, dataRows, headers) {
  const newKey = duplicateKey_(row);
  if (!newKey) return false;

  const submissionIdIdx = headers.indexOf(SUBMISSION_ID_HEADER);
  const currentId = String(row[SUBMISSION_ID_HEADER] || '').trim();

  return dataRows.some(function (r) {
    if (submissionIdIdx !== -1 && currentId && String(r[submissionIdIdx] || '').trim() === currentId) {
      return false;
    }
    return duplicateKey_(rowObjectFromSheetRow_(headers, r)) === newKey;
  });
}

function saveResumeToDrive_(resumeFile, submissionId) {
  const folder = getOrCreateResumeFolder_();
  const safeName = String(resumeFile.name || 'resume').replace(/[\\/:*?"<>|]+/g, '_');
  const filename = submissionId + ' - ' + safeName;
  const bytes = Utilities.base64Decode(resumeFile.data);
  const blob = Utilities.newBlob(
    bytes,
    resumeFile.mimeType || 'application/octet-stream',
    filename
  );

  const existing = folder.getFilesByName(filename);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    url: file.getUrl(),
    name: safeName,
  };
}

function getOrCreateResumeFolder_() {
  const folders = DriveApp.getFoldersByName(RESUMES_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(RESUMES_FOLDER_NAME);
}

function highlightRow_(sheet, rowNumber, numCols, color) {
  const range = sheet.getRange(rowNumber, 1, 1, numCols);
  if (!color) {
    range.setBackground(null);
    return;
  }
  range.setBackground(color);
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
