'use strict';

const TOTAL = 11; // 7 text fields + gender + ethnicity + citizenship + resume
const STORAGE_KEY = 'gcsp_form1';


// ── SESSION SAVE / RESTORE ────────────────────────────────────────────────────

function saveFormData() {
    try {
        const data = {
            fullName:       document.getElementById('fullName').value,
            currentCompany: document.getElementById('currentCompany').value,
            vertical:       document.getElementById('vertical').value,
            location:       document.getElementById('location').value,
            undergradYear:  document.getElementById('undergradYear').value,
            email:          document.getElementById('email').value,
            phone:          document.getElementById('phone').value,
            gender:         [...document.querySelectorAll('input[name="gender"]:checked')].map(cb => cb.value),
            genderCustom:   document.getElementById('genderCustom').value,
            ethnicity:      [...document.querySelectorAll('input[name="ethnicity"]:checked')].map(cb => cb.value),
            citizenship:    [...document.querySelectorAll('input[name="citizenship"]:checked')].map(cb => cb.value),
            resumeFileName: document.getElementById('resumeFile').files[0]?.name || '',
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* sessionStorage unavailable (private mode, etc.) — silently skip */ }
}

function restoreFormData() {
    let data;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        data = JSON.parse(raw);
    } catch (e) { return; }

    // Text inputs
    ['fullName', 'currentCompany', 'vertical', 'undergradYear', 'email', 'phone'].forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id]) el.value = data[id];
    });

    // Location select
    const locationEl = document.getElementById('location');
    if (locationEl && data.location) locationEl.value = data.location;

    // Gender checkboxes
    if (data.gender?.length) {
        data.gender.forEach(val => {
            const cb = [...document.querySelectorAll('input[name="gender"]')].find(c => c.value === val);
            if (cb) cb.checked = true;
        });
        if (data.gender.includes('Let me type')) {
            document.getElementById('gender-custom-wrap').classList.add('visible');
        }
    }
    if (data.genderCustom) {
        const el = document.getElementById('genderCustom');
        if (el) el.value = data.genderCustom;
    }

    // Ethnicity checkboxes
    data.ethnicity?.forEach(val => {
        const cb = [...document.querySelectorAll('input[name="ethnicity"]')].find(c => c.value === val);
        if (cb) cb.checked = true;
    });

    // Citizenship checkboxes
    data.citizenship?.forEach(val => {
        const cb = [...document.querySelectorAll('input[name="citizenship"]')].find(c => c.value === val);
        if (cb) cb.checked = true;
    });

    // Resume — file objects can't be restored by browsers (security restriction),
    // but show the filename so the user knows exactly which file to re-select.
    if (data.resumeFileName) {
        const fileChosen = document.getElementById('file-chosen');
        if (fileChosen) {
            fileChosen.textContent = `${data.resumeFileName} — please re-select this file`;
            fileChosen.classList.add('visible', 'needs-reselect');
        }
    }

    updateProgress();
}

// Auto-save on every interaction (debounced so it doesn't fire on every keystroke)
let _saveTimer;
function debouncedSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveFormData, 400);
}

document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', debouncedSave);
    el.addEventListener('input',  debouncedSave);
});


// ── PROGRESS ──────────────────────────────────────────────────────────────────

function countFilled() {
    let n = 0;

    const textIds = ['fullName', 'currentCompany', 'vertical', 'undergradYear', 'email', 'phone'];
    textIds.forEach(id => {
        if (document.getElementById(id)?.value.trim()) n++;
    });

    // Location is a select
    if (document.getElementById('location')?.value) n++;

    const genderChecked = document.querySelectorAll('input[name="gender"]:checked');
    let genderOk = genderChecked.length > 0;
    if (genderOk && document.getElementById('gender-let-me-type')?.checked) {
        genderOk = !!document.getElementById('genderCustom')?.value.trim();
    }
    if (genderOk) n++;

    if (document.querySelectorAll('input[name="ethnicity"]:checked').length) n++;
    if (document.querySelectorAll('input[name="citizenship"]:checked').length) n++;
    if (document.getElementById('resumeFile')?.files.length) n++;

    return n;
}

function updateProgress() {
    const pct = Math.round((countFilled() / TOTAL) * 100);
    document.getElementById('completion-fill').style.width = pct + '%';
}

document.querySelectorAll('input').forEach(el => {
    el.addEventListener('change', updateProgress);
    el.addEventListener('input', updateProgress);
});


// ── PHONE FORMATTING ──────────────────────────────────────────────────────────

document.getElementById('phone')?.addEventListener('input', function () {
    let raw = this.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length >= 7)      this.value = `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`;
    else if (raw.length >= 4) this.value = `(${raw.slice(0,3)}) ${raw.slice(3)}`;
    else if (raw.length > 0)  this.value = `(${raw}`;
    else                      this.value = raw;
});


// ── "LET ME TYPE" TOGGLE ──────────────────────────────────────────────────────

document.getElementById('gender-let-me-type')?.addEventListener('change', function () {
    const wrap  = document.getElementById('gender-custom-wrap');
    const input = document.getElementById('genderCustom');
    if (this.checked) {
        wrap.classList.add('visible');
        input.focus();
    } else {
        wrap.classList.remove('visible');
        input.value = '';
        input.classList.remove('has-error');
        document.getElementById('genderCustom-err').textContent = '';
    }
    updateProgress();
});


// ── UPLOAD ZONE ───────────────────────────────────────────────────────────────

const zone       = document.getElementById('upload-zone');
const fileInput  = document.getElementById('resumeFile');
const fileChosen = document.getElementById('file-chosen');
const chooseBtn  = document.getElementById('choose-file-btn');

function showFileName(name) {
    fileChosen.textContent = name;
    fileChosen.classList.add('visible');
    fileChosen.classList.remove('needs-reselect');
}

chooseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

zone?.addEventListener('click', () => fileInput.click());

zone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
});
zone?.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone?.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        showFileName(file.name);
        document.getElementById('resume-err').textContent = '';
        document.getElementById('section-resume').classList.remove('has-error');
        updateProgress();
    }
});

fileInput?.addEventListener('change', () => {
    if (fileInput.files[0]) {
        showFileName(fileInput.files[0].name);
        document.getElementById('resume-err').textContent = '';
        document.getElementById('section-resume').classList.remove('has-error');
        updateProgress();
    }
});


// ── LIVE ERROR CLEARING ───────────────────────────────────────────────────────

document.getElementById('location')?.addEventListener('change', function () {
    this.classList.remove('has-error');
    document.getElementById('location-err').textContent = '';
    this.closest('.form-section')?.classList.remove('has-error');
    updateProgress();
});

document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').forEach(input => {
    input.addEventListener('input', function () {
        this.classList.remove('has-error');
        const errSpan = this.nextElementSibling;
        if (errSpan?.classList.contains('err-msg')) errSpan.textContent = '';
        this.closest('.form-section')?.classList.remove('has-error');
    });
});

document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function () {
        const name    = this.name;
        const errEl   = document.getElementById(name + '-err');
        const section = this.closest('.form-section');
        if (errEl && document.querySelectorAll(`input[name="${name}"]:checked`).length > 0) {
            errEl.textContent = '';
            section?.classList.remove('has-error');
        }
    });
});


// ── VALIDATION ────────────────────────────────────────────────────────────────

function clearAllErrors() {
    document.querySelectorAll('.err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('has-error'));
}

function markError(inputEl, msg) {
    inputEl.classList.add('has-error');
    const errSpan = inputEl.nextElementSibling;
    if (errSpan?.classList.contains('err-msg')) errSpan.textContent = msg;
    inputEl.closest('.form-section')?.classList.add('has-error');
}

function validate() {
    clearAllErrors();
    let ok = true;

    // --- Location dropdown ---
    const locationEl = document.getElementById('location');
    if (!locationEl.value) {
        locationEl.classList.add('has-error');
        document.getElementById('location-err').textContent = 'Please select a location.';
        locationEl.closest('.form-section')?.classList.add('has-error');
        ok = false;
    }

    // --- Text fields ---
    const textFields = [
        { id: 'fullName',       label: 'Full name'       },
        { id: 'currentCompany', label: 'Current company' },
        { id: 'vertical',       label: 'Vertical / Group'},
        { id: 'undergradYear',  label: 'Undergrad year'  },
        { id: 'email',          label: 'Email'           },
        { id: 'phone',          label: 'Phone number'    },
    ];

    textFields.forEach(({ id, label }) => {
        const el = document.getElementById(id);
        const val = el.value.trim();

        if (!val) {
            markError(el, `${label} is required.`);
            ok = false;
        } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            markError(el, 'Enter a valid email address.');
            ok = false;
        } else if (id === 'undergradYear') {
            const yr = parseInt(val, 10);
            if (isNaN(yr) || yr < 1970 || yr > 2030) {
                markError(el, 'Enter a year between 1970 and 2030.');
                ok = false;
            }
        } else if (id === 'phone' && val.replace(/\D/g, '').length < 10) {
            markError(el, 'Enter a 10-digit phone number.');
            ok = false;
        } else {
            el.classList.add('is-valid');
        }
    });

    // --- Gender ---
    const genderChecked = document.querySelectorAll('input[name="gender"]:checked');
    if (genderChecked.length === 0) {
        document.getElementById('gender-err').textContent = 'Please select at least one option.';
        document.getElementById('section-gender').classList.add('has-error');
        ok = false;
    } else if (document.getElementById('gender-let-me-type')?.checked) {
        const custom = document.getElementById('genderCustom');
        if (!custom.value.trim()) {
            custom.classList.add('has-error');
            document.getElementById('genderCustom-err').textContent = 'Please describe yourself, or uncheck "Let me type."';
            document.getElementById('section-gender').classList.add('has-error');
            ok = false;
        }
    }

    // --- Ethnicity ---
    if (!document.querySelectorAll('input[name="ethnicity"]:checked').length) {
        document.getElementById('ethnicity-err').textContent = 'Please select at least one option.';
        document.getElementById('section-ethnicity').classList.add('has-error');
        ok = false;
    }

    // --- Citizenship ---
    if (!document.querySelectorAll('input[name="citizenship"]:checked').length) {
        document.getElementById('citizenship-err').textContent = 'Please select at least one option.';
        document.getElementById('section-citizenship').classList.add('has-error');
        ok = false;
    }

    // --- Resume ---
    if (!fileInput?.files.length) {
        document.getElementById('resume-err').textContent = 'Please upload your resume.';
        document.getElementById('section-resume').classList.add('has-error');
        ok = false;
    }

    return ok;
}


// ── SUBMIT ────────────────────────────────────────────────────────────────────

document.getElementById('resume-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validate()) {
        const firstError = document.querySelector('.has-error');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Save final state before navigating away
    saveFormData();

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Continuing…';

    const submissionId = getOrCreateSubmissionId();

    // Keep resume bytes in IndexedDB so Registration can upload them to Drive
    // (browsers won't restore file inputs after navigation).
    try {
        const resumeFile = document.getElementById('resumeFile')?.files[0];
        if (resumeFile) await saveResumeBlob(submissionId, resumeFile);
    } catch (err) {
        console.warn('Could not persist resume for the next step:', err);
    }

    // Best-effort: push what's been entered here to the Sheet immediately, so a
    // candidate who never continues into Registration still leaves a record.
    // If this fails, their data is still safe locally, and Registration's own
    // Page 1 sync will create/update the same row (matched by Submission ID).
    try {
        const resumeFile = await buildResumePayload(fileInput);
        const row = {
            'Submitted At': new Date().toISOString(),
            'Submission ID': submissionId,
            ...collectForm1SheetFields(),
        };
        await submitRowToSheet({
            row,
            submissionId,
            force: false,
            resumeFile,
            completionStatus: 'In Progress - Resume Drop',
        });
    } catch (err) {
        console.warn('Could not sync resume-drop progress to the Google Sheet:', err);
    }

    const year = document.getElementById('undergradYear').value.trim();
    const yr   = parseInt(year, 10);

    // Route each class year to its dedicated registration form.
    // Add new entries here as forms for additional years are built.
    const routes = {
        2026: 'registration-2026.html',
    };
    const dest = routes[yr] || 'registration.html';

    setTimeout(() => {
        window.location.href = `${dest}?year=${encodeURIComponent(year)}`;
    }, 450);
});


// ── INIT ──────────────────────────────────────────────────────────────────────
restoreFormData();
updateProgress();
