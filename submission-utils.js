'use strict';

// Shared helpers for persisting resume bytes between Form 1 and Registration,
// and for talking to the Google Apps Script webhook.

const GCSP_SUBMISSION_ID_KEY = 'gcsp_submission_id';
const GCSP_RESUME_DB_NAME = 'gcsp_resume_store';
const GCSP_RESUME_DB_VERSION = 1;
const GCSP_RESUME_STORE = 'resumes';

const GCSP_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby5rCo6ogeVUAujR_IGuU5kVTJOJGC34zLLLynlfBZBmS2fog_e1NZna6wnI9_oZeGp/exec';

function getOrCreateSubmissionId() {
    try {
        let id = sessionStorage.getItem(GCSP_SUBMISSION_ID_KEY);
        if (!id) {
            id = (crypto.randomUUID && crypto.randomUUID()) ||
                'gcsp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem(GCSP_SUBMISSION_ID_KEY, id);
        }
        return id;
    } catch (e) {
        return 'gcsp-' + Date.now().toString(36);
    }
}

function getStoredSubmissionId() {
    try {
        return sessionStorage.getItem(GCSP_SUBMISSION_ID_KEY) || '';
    } catch (e) {
        return '';
    }
}

function openResumeDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(GCSP_RESUME_DB_NAME, GCSP_RESUME_DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(GCSP_RESUME_STORE)) {
                db.createObjectStore(GCSP_RESUME_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveResumeBlob(submissionId, file) {
    if (!file || !submissionId) return;
    const db = await openResumeDb();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(GCSP_RESUME_STORE, 'readwrite');
        tx.objectStore(GCSP_RESUME_STORE).put(
            { blob: file, name: file.name, mimeType: file.type || 'application/octet-stream' },
            submissionId
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

async function loadResumeBlob(submissionId) {
    if (!submissionId) return null;
    try {
        const db = await openResumeDb();
        const record = await new Promise((resolve, reject) => {
            const tx = db.transaction(GCSP_RESUME_STORE, 'readonly');
            const req = tx.objectStore(GCSP_RESUME_STORE).get(submissionId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return record;
    } catch (e) {
        return null;
    }
}

async function clearResumeBlob(submissionId) {
    if (!submissionId) return;
    try {
        const db = await openResumeDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(GCSP_RESUME_STORE, 'readwrite');
            tx.objectStore(GCSP_RESUME_STORE).delete(submissionId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    } catch (e) { /* ignore */ }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result || '';
            const base64 = String(result).split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function buildResumePayload(liveFileInput) {
    const liveFile = liveFileInput?.files?.[0];
    if (liveFile) {
        return {
            name: liveFile.name,
            mimeType: liveFile.type || 'application/octet-stream',
            data: await fileToBase64(liveFile),
        };
    }

    const submissionId = getStoredSubmissionId() || getOrCreateSubmissionId();
    const stored = await loadResumeBlob(submissionId);
    if (!stored?.blob) return null;

    return {
        name: stored.name,
        mimeType: stored.mimeType,
        data: await fileToBase64(stored.blob),
    };
}

async function submitRowToSheet({ row, submissionId, force, resumeFile, completionStatus }) {
    const payload = {
        row: { ...row },
        submissionId: submissionId || getOrCreateSubmissionId(),
        force: !!force,
    };
    if (completionStatus) payload.row['Completion Status'] = completionStatus;
    if (resumeFile?.data) payload.resumeFile = resumeFile;

    const response = await fetch(GCSP_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.error) console.error('Google Sheet webhook error:', result.error);

    if (result.submissionId) {
        try { sessionStorage.setItem(GCSP_SUBMISSION_ID_KEY, result.submissionId); } catch (e) { /* ignore */ }
    }

    return result;
}

async function clearSubmissionSession() {
    const id = getStoredSubmissionId();
    try { sessionStorage.removeItem(GCSP_SUBMISSION_ID_KEY); } catch (e) { /* ignore */ }
    await clearResumeBlob(id);
}

function readForm1Data() {
    try {
        const raw = sessionStorage.getItem('gcsp_form1');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function collectForm1SheetFields() {
    const form1 = readForm1Data();
    if (!form1) return {};

    const gender = (form1.gender || []).slice();
    if (form1.genderCustom) {
        const idx = gender.indexOf('Let me type');
        if (idx !== -1) gender[idx] = `Let me type: ${form1.genderCustom}`;
    }

    return {
        'Website Resume Drop - Full Name': form1.fullName || '',
        'Website Resume Drop - Current Company': form1.currentCompany || '',
        'Website Resume Drop - Vertical/Group': form1.vertical || '',
        'Website Resume Drop - Location': form1.location || '',
        'Website Resume Drop - Undergrad Year': form1.undergradYear || '',
        'Website Resume Drop - Email': form1.email || '',
        'Website Resume Drop - Phone': form1.phone || '',
        'Website Resume Drop - Gender': gender.join('; '),
        'Website Resume Drop - Ethnicity': (form1.ethnicity || []).join('; '),
        'Website Resume Drop - Citizenship/Visa': (form1.citizenship || []).join('; '),
    };
}
