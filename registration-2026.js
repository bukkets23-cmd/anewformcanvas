'use strict';

// ── YEAR FROM URL ─────────────────────────────────────────────────────────────
const params    = new URLSearchParams(window.location.search);
const classYear = params.get('year') || '2026';
document.getElementById('class-year').textContent = classYear;
document.title = `Analyst Class of ${classYear} Registration — Gold Coast Search Partners`;

const STORAGE_KEY = `gcsp_registration_${classYear}`;


// ── PAGE STATE ────────────────────────────────────────────────────────────────
let currentPage = 1;
const TOTAL_PAGES = 6;

function showPage(n) {
    document.querySelectorAll('.form-page').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === n);
    });
    document.querySelectorAll('.page-pip').forEach((pip, i) => {
        pip.classList.toggle('active', i + 1 === n);
    });
    const subtitles = {
        1: 'Page 1 — Complete all fields to continue.',
        2: 'Page 2 — Almost there.',
        3: 'Page 3 — Final stretch.',
        4: 'Page 4 — Almost done.',
        5: 'Page 5 — Almost done.',
        6: 'Page 6 — Last one.',
    };
    document.getElementById('page-subtitle').textContent = subtitles[n] || `Page ${n}`;
    currentPage = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
}

document.getElementById('back-btn-2')?.addEventListener('click', () => showPage(1));
document.getElementById('back-btn-3')?.addEventListener('click', () => showPage(2));
document.getElementById('back-btn-4')?.addEventListener('click', () => showPage(3));
document.getElementById('back-btn-5')?.addEventListener('click', () => showPage(4));
document.getElementById('back-btn-6')?.addEventListener('click', () => showPage(5));


// ── PHONE FORMATTING ──────────────────────────────────────────────────────────
document.getElementById('regPhone')?.addEventListener('input', function () {
    let raw = this.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length >= 7)      this.value = `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`;
    else if (raw.length >= 4) this.value = `(${raw.slice(0,3)}) ${raw.slice(3)}`;
    else if (raw.length > 0)  this.value = `(${raw}`;
    else                      this.value = raw;
});


// ── SESSION SAVE / RESTORE ────────────────────────────────────────────────────
// Persists answers across back-button navigation / accidental reloads so the
// candidate never has to re-type everything (and we don't collect duplicate
// half-filled submissions).

function saveFormData() {
    try {
        const data = { text: {}, radio: {}, checkbox: {} };

        document.querySelectorAll(
            '#page-1 input[type="text"], #page-1 input[type="email"], #page-1 input[type="tel"], ' +
            '#page-1 input[type="date"], #page-1 input[type="url"], #page-1 select, ' +
            '#page-2 input[type="text"], #page-2 select, ' +
            '#page-3 input[type="text"], #page-3 select, ' +
            '#page-4 input[type="text"], #page-4 select, #page-4 textarea, ' +
            '#page-5 input[type="text"], #page-5 select, ' +
            '#page-6 input[type="text"], #page-6 select, #page-6 textarea'
        ).forEach(el => {
            if (el.id) data.text[el.id] = el.value;
        });

        const radioNames = new Set();
        document.querySelectorAll('#page-1 input[type="radio"], #page-2 input[type="radio"], #page-3 input[type="radio"], #page-4 input[type="radio"], #page-5 input[type="radio"], #page-6 input[type="radio"]').forEach(el => radioNames.add(el.name));
        radioNames.forEach(name => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (checked) data.radio[name] = checked.value;
        });

        const checkboxNames = new Set();
        document.querySelectorAll('#page-1 input[type="checkbox"], #page-2 input[type="checkbox"], #page-3 input[type="checkbox"], #page-4 input[type="checkbox"], #page-5 input[type="checkbox"], #page-6 input[type="checkbox"]').forEach(el => checkboxNames.add(el.name));
        checkboxNames.forEach(name => {
            data.checkbox[name] = [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(cb => cb.value);
        });

        const resumeInputEl = document.getElementById('resumeFile2026');
        if (resumeInputEl?.files.length) {
            data.resumeFileName2026 = resumeInputEl.files[0].name;
        }

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

    // Text inputs and selects
    Object.entries(data.text || {}).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
    });

    // Fire "change" on selects so conditional "Other" reveals show correctly
    document.querySelectorAll('#page-1 select, #page-2 select, #page-3 select, #page-4 select, #page-5 select, #page-6 select').forEach(el => {
        if (el.value) el.dispatchEvent(new Event('change'));
    });

    // Radio groups — fire "change" so conditional reveals show correctly
    Object.entries(data.radio || {}).forEach(([name, val]) => {
        const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
    });

    // Checkbox groups
    Object.entries(data.checkbox || {}).forEach(([name, vals]) => {
        (vals || []).forEach(val => {
            const cb = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (cb) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}

// Auto-save on every interaction (debounced so it doesn't fire on every keystroke)
let _saveTimer;
function debouncedSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveFormData, 400);
}

document.querySelectorAll('#page-1 input, #page-1 select, #page-2 input, #page-2 select, #page-3 input, #page-3 select, #page-4 input, #page-4 select, #page-4 textarea, #page-5 input, #page-5 select, #page-6 input, #page-6 select, #page-6 textarea').forEach(el => {
    el.addEventListener('change', debouncedSave);
    el.addEventListener('input', debouncedSave);
});

// Flush immediately before navigating away (header "Back" link, tab close, refresh)
window.addEventListener('beforeunload', saveFormData);


// ── RESUME UPLOAD (Page 6) ────────────────────────────────────────────────────
// Reuses Form 1's upload-zone pattern. If the candidate already uploaded a
// resume on Form 1 (or earlier in this session), we surface that instead of
// making them upload it again.

function getForm1ResumeFileName() {
    try {
        const raw = sessionStorage.getItem('gcsp_form1');
        if (!raw) return '';
        return JSON.parse(raw).resumeFileName || '';
    } catch (e) { return ''; }
}

const resumeZone      = document.getElementById('upload-zone-2026');
const resumeInput     = document.getElementById('resumeFile2026');
const resumeChosen    = document.getElementById('file-chosen-2026');
const resumeChooseBtn = document.getElementById('choose-file-btn-2026');

function showResumeFileName(name) {
    resumeChosen.textContent = name;
    resumeChosen.classList.add('visible');
    resumeChosen.classList.remove('needs-reselect');
}

function clearResumeError() {
    document.getElementById('resumeFile2026-err').textContent = '';
    document.getElementById('s-additional-info')?.classList.remove('has-error');
}

resumeChooseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    resumeInput.click();
});

resumeZone?.addEventListener('click', () => resumeInput.click());

resumeZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    resumeZone.classList.add('drag-over');
});
resumeZone?.addEventListener('dragleave', () => resumeZone.classList.remove('drag-over'));
resumeZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    resumeZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        resumeInput.files = dt.files;
        showResumeFileName(file.name);
        clearResumeError();
        updateProgress();
    }
});

resumeInput?.addEventListener('change', () => {
    if (resumeInput.files[0]) {
        showResumeFileName(resumeInput.files[0].name);
        clearResumeError();
        updateProgress();
    }
});

// True once the candidate has a resume attached — either chosen just now,
// or already on file from Form 1 — so we never force a duplicate upload.
function resumeSatisfied() {
    return !!(resumeInput?.files.length) || !!getForm1ResumeFileName();
}

// Populate the upload zone on load: prefer a live file (already chosen this
// load), then this page's own remembered filename (needs re-selecting after
// a reload — browsers can't restore actual file bytes), then Form 1's record.
function initResumeDisplay() {
    if (!resumeInput || resumeInput.files.length) return;

    let ownName = '';
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) ownName = JSON.parse(raw).resumeFileName2026 || '';
    } catch (e) { /* ignore */ }

    if (ownName) {
        resumeChosen.textContent = `${ownName} — please re-select this file`;
        resumeChosen.classList.add('visible', 'needs-reselect');
        return;
    }

    const form1Name = getForm1ResumeFileName();
    if (form1Name) {
        resumeChosen.textContent = `${form1Name} — already on file from your earlier upload. Choose a new file only if you'd like to replace it.`;
        resumeChosen.classList.add('visible');
        resumeChosen.classList.remove('needs-reselect');
    }
}


// ── CONDITIONAL REVEALS ───────────────────────────────────────────────────────

// Summer intern: show firm input when "No" is selected
document.querySelectorAll('input[name="summerIntern"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const reveal = document.getElementById('summer-reveal');
        const firmInput = document.getElementById('summerFirm');
        if (this.value === 'No') {
            reveal.classList.add('visible');
            firmInput.focus();
        } else {
            reveal.classList.remove('visible');
            firmInput.value = '';
            firmInput.classList.remove('has-error');
            document.getElementById('summerFirm-err').textContent = '';
        }
        clearSectionError('summerIntern');
        updateProgress();
    });
});

// Investing internship: show firm input when "Yes" is selected
document.querySelectorAll('input[name="investingIntern"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const reveal = document.getElementById('investing-reveal');
        const firmInput = document.getElementById('investingFirm');
        if (this.value === 'Yes') {
            reveal.classList.add('visible');
            firmInput.focus();
        } else {
            reveal.classList.remove('visible');
            firmInput.value = '';
            firmInput.classList.remove('has-error');
            document.getElementById('investingFirm-err').textContent = '';
        }
        clearSectionError('investingIntern');
        updateProgress();
    });
});

// Renewables: just clear error on any selection
document.querySelectorAll('input[name="renewables"]').forEach(radio => {
    radio.addEventListener('change', () => {
        clearSectionError('renewables');
        updateProgress();
    });
});

// Expected graduation term: show a text box when "Other" is selected
document.querySelectorAll('input[name="gradTerm"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const reveal = document.getElementById('gradTerm-reveal');
        const otherInput = document.getElementById('gradTermOther');
        if (this.value === 'Other') {
            reveal.classList.add('visible');
            otherInput.focus();
        } else {
            reveal.classList.remove('visible');
            otherInput.value = '';
            otherInput.classList.remove('has-error');
            document.getElementById('gradTermOther-err').textContent = '';
        }
        clearSectionError('gradTerm');
        updateProgress();
    });
});

// Degree(s) checkboxes: clear error on any change
document.querySelectorAll('input[name="degree"]').forEach(cb => {
    cb.addEventListener('change', () => {
        document.getElementById('degree-err').textContent = '';
        document.getElementById('s-education')?.classList.remove('has-error');
        updateProgress();
    });
});

// Investing club / student endowment: show org input when "Yes" is selected
document.querySelectorAll('input[name="investingClub"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const reveal = document.getElementById('investingClub-reveal');
        const orgInput = document.getElementById('investingClubOrg');
        if (this.value === 'Yes') {
            reveal.classList.add('visible');
            orgInput.focus();
        } else {
            reveal.classList.remove('visible');
            orgInput.value = '';
            orgInput.classList.remove('has-error');
            document.getElementById('investingClubOrg-err').textContent = '';
        }
        clearSectionError('investingClub');
        updateProgress();
    });
});

// Selects with an "Other" option: show a text box when it's chosen
function wireOtherReveal(selectId, revealId, otherInputId, otherErrId, otherValue = 'Other (not listed)') {
    const select = document.getElementById(selectId);
    select?.addEventListener('change', function () {
        const reveal = document.getElementById(revealId);
        const otherInput = document.getElementById(otherInputId);
        if (this.value === otherValue) {
            reveal.classList.add('visible');
            otherInput.focus();
        } else {
            reveal.classList.remove('visible');
            otherInput.value = '';
            otherInput.classList.remove('has-error');
            document.getElementById(otherErrId).textContent = '';
        }
    });
}
wireOtherReveal('firmName', 'firmName-reveal', 'firmNameOther', 'firmNameOther-err');
wireOtherReveal('officeLocation', 'officeLocation-reveal', 'officeLocationOther', 'officeLocationOther-err');
wireOtherReveal('undergradInstitution', 'undergradInstitution-reveal', 'undergradInstitutionOther', 'undergradInstitutionOther-err', 'Other');

// Ethnicity checkboxes: clear error on any change
document.querySelectorAll('input[name="ethnicityBg"]').forEach(cb => {
    cb.addEventListener('change', () => {
        document.getElementById('ethnicityBg-err').textContent = '';
        document.getElementById('s-background')?.classList.remove('has-error');
        updateProgress();
    });
});

// Citizenship/Visa: clear error on any change
document.querySelectorAll('input[name="citizenshipVisa"]').forEach(cb => {
    cb.addEventListener('change', () => {
        document.getElementById('citizenshipVisa-err').textContent = '';
        document.getElementById('s-background')?.classList.remove('has-error');
        updateProgress();
    });
});

// Citizenship/Visa: show a text box when "Visa: Other" is checked
document.querySelector('input[name="citizenshipVisa"][value="Visa: Other"]')?.addEventListener('change', function () {
    const reveal = document.getElementById('citizenshipVisaOther-reveal');
    const otherInput = document.getElementById('citizenshipVisaOther');
    if (this.checked) {
        reveal.classList.add('visible');
        otherInput.focus();
    } else {
        reveal.classList.remove('visible');
        otherInput.value = '';
        otherInput.classList.remove('has-error');
        document.getElementById('citizenshipVisaOther-err').textContent = '';
    }
});

// Gender Identity checkboxes: clear error on any change
document.querySelectorAll('input[name="gender"]').forEach(cb => {
    cb.addEventListener('change', () => {
        document.getElementById('gender-err').textContent = '';
        document.getElementById('s-background')?.classList.remove('has-error');
        updateProgress();
    });
});

// Gender Identity: show a text box when "Let me type…" is checked
document.getElementById('gender-let-me-type')?.addEventListener('change', function () {
    const reveal = document.getElementById('gender-reveal');
    const customInput = document.getElementById('genderCustom');
    if (this.checked) {
        reveal.classList.add('visible');
        customInput.focus();
    } else {
        reveal.classList.remove('visible');
        customInput.value = '';
        customInput.classList.remove('has-error');
        document.getElementById('genderCustom-err').textContent = '';
    }
});

// Search Interests / Geographic Interests / Vertical Interests checkboxes: clear error on any change
[
    { name: 'searchInterests',   errId: 'searchInterests-err'   },
    { name: 'geoInterests',      errId: 'geoInterests-err'      },
    { name: 'verticalInterests', errId: 'verticalInterests-err' },
].forEach(({ name, errId }) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
        cb.addEventListener('change', () => {
            document.getElementById(errId).textContent = '';
            document.getElementById('s-search-interests')?.classList.remove('has-error');
            updateProgress();
        });
    });
});

// Page 5 checkbox groups: clear error on any change
[
    { name: 'startDatePref',            errId: 'startDatePref-err'            },
    { name: 'megafundInterests',        errId: 'megafundInterests-err'        },
    { name: 'middleMarketInterests',    errId: 'middleMarketInterests-err'    },
    { name: 'impactInvestingInterests', errId: 'impactInvestingInterests-err' },
].forEach(({ name, errId }) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
        cb.addEventListener('change', () => {
            document.getElementById(errId).textContent = '';
            document.getElementById('s-page5')?.classList.remove('has-error');
            updateProgress();
        });
    });
});

// On Cycle 2028: clear error on any selection
document.querySelectorAll('input[name="onCycle2028"]').forEach(radio => {
    radio.addEventListener('change', () => {
        document.getElementById('onCycle2028-err').textContent = '';
        document.getElementById('s-page5')?.classList.remove('has-error');
        updateProgress();
    });
});


// ── PROGRESS ─────────────────────────────────────────────────────────────────
// Counts required fields per page (all 6 pages live in this one document, so
// every counter below can run regardless of which page is currently shown).
// The bar sums across all of them, so it reflects true whole-form completion
// and only climbs as pages advance — it doesn't reset each time a new page
// starts with fewer of its own fields filled in.

function countPage1Filled() {
    let n = 0;

    // Text / email / tel / date inputs
    ['firstName', 'lastName', 'regEmail', 'regPhone', 'vertical2026', 'startDate'].forEach(id => {
        if (document.getElementById(id)?.value.trim()) n++;
    });

    // Selects
    ['firmName', 'officeLocation', 'position'].forEach(id => {
        if (document.getElementById(id)?.value) n++;
    });

    // Radio groups
    if (document.querySelector('input[name="summerIntern"]:checked'))  n++;
    if (document.querySelector('input[name="investingIntern"]:checked')) n++;
    if (document.querySelector('input[name="renewables"]:checked'))    n++;

    return n;
}

const PAGE1_TOTAL = 12;

function countPage2Filled() {
    let n = 0;

    if (document.querySelector('input[name="degree"]:checked')) n++;
    if (document.getElementById('undergradYear')?.value) n++;
    if (document.querySelector('input[name="gradTerm"]:checked')) n++;
    if (document.getElementById('undergradInstitution')?.value) n++;
    if (document.getElementById('gpa')?.value.trim()) n++;
    if (document.querySelector('input[name="investingClub"]:checked')) n++;
    if (document.getElementById('satMath')?.value.trim()) n++;
    if (document.getElementById('satVerbal')?.value.trim()) n++;
    if (document.getElementById('actScore')?.value.trim()) n++;

    return n;
}

const PAGE2_TOTAL = 9;

function countPage3Filled() {
    let n = 0;

    if (document.querySelectorAll('input[name="ethnicityBg"]:checked').length) n++;
    if (document.querySelectorAll('input[name="citizenshipVisa"]:checked').length) n++;
    if (document.querySelectorAll('input[name="gender"]:checked').length) n++;
    if (document.getElementById('hometownState')?.value) n++;
    if (document.getElementById('hometownMetro')?.value) n++;

    return n;
}

const PAGE3_TOTAL = 5;

function countPage4Filled() {
    let n = 0;

    if (document.querySelectorAll('input[name="searchInterests"]:checked').length) n++;
    if (document.querySelectorAll('input[name="geoInterests"]:checked').length) n++;
    if (document.getElementById('geoPref1')?.value) n++;
    if (document.getElementById('geoPref2')?.value) n++;
    if (document.getElementById('geoPref3')?.value) n++;
    if (document.querySelectorAll('input[name="verticalInterests"]:checked').length) n++;

    return n;
}

const PAGE4_TOTAL = 6;

function countPage5Filled() {
    let n = 0;

    if (document.querySelectorAll('input[name="startDatePref"]:checked').length) n++;
    if (document.querySelector('input[name="onCycle2028"]:checked')) n++;
    if (document.querySelectorAll('input[name="megafundInterests"]:checked').length) n++;
    if (document.querySelectorAll('input[name="middleMarketInterests"]:checked').length) n++;
    if (document.querySelectorAll('input[name="impactInvestingInterests"]:checked').length) n++;

    return n;
}

const PAGE5_TOTAL = 5;

function countPage6Filled() {
    return resumeSatisfied() ? 1 : 0;
}

const PAGE6_TOTAL = 1;

const FORM_TOTAL = PAGE1_TOTAL + PAGE2_TOTAL + PAGE3_TOTAL + PAGE4_TOTAL + PAGE5_TOTAL + PAGE6_TOTAL;

function updateProgress() {
    const filled = countPage1Filled() + countPage2Filled() + countPage3Filled()
        + countPage4Filled() + countPage5Filled() + countPage6Filled();
    const pct = Math.round((filled / FORM_TOTAL) * 100);
    document.getElementById('completion-fill').style.width = Math.min(pct, 100) + '%';
}

document.querySelectorAll('#page-1 input, #page-1 select, #page-2 input, #page-2 select, #page-3 input, #page-3 select, #page-4 input, #page-4 select, #page-4 textarea, #page-5 input, #page-5 select, #page-6 input, #page-6 select, #page-6 textarea').forEach(el => {
    el.addEventListener('change', updateProgress);
    el.addEventListener('input', updateProgress);
});


// ── VALIDATION ────────────────────────────────────────────────────────────────

function clearSectionError(name) {
    const errEl = document.getElementById(name + '-err');
    if (errEl) errEl.textContent = '';
    document.querySelector(`input[name="${name}"]`)?.closest('.form-section')?.classList.remove('has-error');
    document.querySelector(`input[name="${name}"]`)?.closest('.question-block')?.classList.remove('has-error');
}

function markInputError(el, msg) {
    el.classList.add('has-error');
    const errSpan = el.nextElementSibling;
    if (errSpan?.classList.contains('err-msg')) errSpan.textContent = msg;
    el.closest('.form-section')?.classList.add('has-error');
}

function clearInputError(el) {
    el.classList.remove('has-error');
    const errSpan = el.nextElementSibling;
    if (errSpan?.classList.contains('err-msg')) errSpan.textContent = '';
    el.closest('.form-section')?.classList.remove('has-error');
}

// Live clear on typing
document.querySelectorAll('#page-1 input[type="text"], #page-1 input[type="email"], #page-1 input[type="tel"], #page-1 input[type="date"], #page-2 input[type="text"], #page-3 input[type="text"], #page-4 input[type="text"], #page-4 textarea, #page-5 input[type="text"], #page-6 input[type="text"], #page-6 textarea').forEach(el => {
    el.addEventListener('input', () => clearInputError(el));
});
document.querySelectorAll('#page-1 select, #page-2 select, #page-3 select, #page-4 select, #page-5 select, #page-6 select').forEach(el => {
    el.addEventListener('change', () => {
        el.classList.remove('has-error');
        const errEl = document.getElementById(el.id + '-err');
        if (errEl) errEl.textContent = '';
        el.closest('.form-section')?.classList.remove('has-error');
    });
});

function validatePage1() {
    // Clear all page 1 errors first
    document.querySelectorAll('#page-1 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-1 input, #page-1 select').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('#page-1 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    // --- Text fields ---
    const textChecks = [
        { id: 'firstName',    label: 'First name'    },
        { id: 'lastName',     label: 'Last name'     },
        { id: 'vertical2026', label: 'Vertical / Group' },
    ];
    textChecks.forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el.value.trim()) { markInputError(el, `${label} is required.`); ok = false; }
        else el.classList.add('is-valid');
    });

    // Email
    const emailEl = document.getElementById('regEmail');
    if (!emailEl.value.trim()) {
        markInputError(emailEl, 'Email is required.'); ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        markInputError(emailEl, 'Enter a valid email address.'); ok = false;
    } else { emailEl.classList.add('is-valid'); }

    // Phone
    const phoneEl = document.getElementById('regPhone');
    if (phoneEl.value.replace(/\D/g, '').length < 10) {
        markInputError(phoneEl, 'Enter a 10-digit phone number.'); ok = false;
    } else { phoneEl.classList.add('is-valid'); }

    // Start date
    const dateEl = document.getElementById('startDate');
    if (!dateEl.value) { markInputError(dateEl, 'Please select a start date.'); ok = false; }
    else dateEl.classList.add('is-valid');

    // Selects
    ['firmName', 'officeLocation', 'position'].forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.classList.add('has-error');
            const errEl = document.getElementById(id + '-err');
            if (errEl) errEl.textContent = 'Please make a selection.';
            el.closest('.form-section')?.classList.add('has-error');
            ok = false;
        }
    });

    // "Other" reveal text boxes — required only when "Other (not listed)" is selected
    [
        { selectId: 'firmName',       otherInputId: 'firmNameOther',       otherErrId: 'firmNameOther-err',       label: 'firm' },
        { selectId: 'officeLocation', otherInputId: 'officeLocationOther', otherErrId: 'officeLocationOther-err', label: 'office location' },
    ].forEach(({ selectId, otherInputId, otherErrId, label }) => {
        const selectEl = document.getElementById(selectId);
        if (selectEl.value === 'Other (not listed)') {
            const otherInput = document.getElementById(otherInputId);
            if (!otherInput.value.trim()) {
                otherInput.classList.add('has-error');
                document.getElementById(otherErrId).textContent = `Please enter your ${label}.`;
                selectEl.closest('.form-section')?.classList.add('has-error');
                ok = false;
            }
        }
    });

    // Radio: summer intern
    const summerChecked = document.querySelector('input[name="summerIntern"]:checked');
    if (!summerChecked) {
        document.getElementById('summerIntern-err').textContent = 'Please select an option.';
        document.getElementById('s-internship').classList.add('has-error');
        ok = false;
    } else if (summerChecked.value === 'No') {
        const firmInput = document.getElementById('summerFirm');
        if (!firmInput.value.trim()) {
            firmInput.classList.add('has-error');
            document.getElementById('summerFirm-err').textContent = 'Please list the firm where you interned.';
            document.getElementById('s-internship').classList.add('has-error');
            ok = false;
        }
    }

    // Radio: investing internship
    const investingChecked = document.querySelector('input[name="investingIntern"]:checked');
    if (!investingChecked) {
        document.getElementById('investingIntern-err').textContent = 'Please select an option.';
        document.getElementById('s-internship').classList.add('has-error');
        ok = false;
    } else if (investingChecked.value === 'Yes') {
        const firmInput = document.getElementById('investingFirm');
        if (!firmInput.value.trim()) {
            firmInput.classList.add('has-error');
            document.getElementById('investingFirm-err').textContent = 'Please list the firm name.';
            document.getElementById('s-internship').classList.add('has-error');
            ok = false;
        }
    }

    // Radio: renewables
    if (!document.querySelector('input[name="renewables"]:checked')) {
        document.getElementById('renewables-err').textContent = 'Please select an option.';
        document.getElementById('s-renewables').classList.add('has-error');
        ok = false;
    }

    return ok;
}

function validatePage2() {
    // Clear all page 2 errors first
    document.querySelectorAll('#page-2 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-2 input, #page-2 select').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('#page-2 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    // Degree(s) — at least one checkbox
    if (!document.querySelector('input[name="degree"]:checked')) {
        document.getElementById('degree-err').textContent = 'Please select at least one option.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    }

    // Undergrad Year
    const undergradYearEl = document.getElementById('undergradYear');
    if (!undergradYearEl.value) {
        undergradYearEl.classList.add('has-error');
        document.getElementById('undergradYear-err').textContent = 'Please select a year.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    }

    // Expected graduation term
    const gradTermChecked = document.querySelector('input[name="gradTerm"]:checked');
    if (!gradTermChecked) {
        document.getElementById('gradTerm-err').textContent = 'Please select an option.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    } else if (gradTermChecked.value === 'Other') {
        const otherInput = document.getElementById('gradTermOther');
        if (!otherInput.value.trim()) {
            otherInput.classList.add('has-error');
            document.getElementById('gradTermOther-err').textContent = 'Please specify your graduation term.';
            document.getElementById('s-education').classList.add('has-error');
            ok = false;
        }
    }

    // Undergraduate Institution
    const undergradInstitutionEl = document.getElementById('undergradInstitution');
    if (!undergradInstitutionEl.value) {
        undergradInstitutionEl.classList.add('has-error');
        document.getElementById('undergradInstitution-err').textContent = 'Please make a selection.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    } else if (undergradInstitutionEl.value === 'Other') {
        const otherInput = document.getElementById('undergradInstitutionOther');
        if (!otherInput.value.trim()) {
            otherInput.classList.add('has-error');
            document.getElementById('undergradInstitutionOther-err').textContent = 'Please enter your undergraduate institution.';
            document.getElementById('s-education').classList.add('has-error');
            ok = false;
        }
    }

    // GPA
    const gpaEl = document.getElementById('gpa');
    const gpaVal = gpaEl.value.trim();
    if (!gpaVal) {
        gpaEl.classList.add('has-error');
        document.getElementById('gpa-err').textContent = 'Please enter your GPA.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    } else {
        const gpaNum = parseFloat(gpaVal);
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
            gpaEl.classList.add('has-error');
            document.getElementById('gpa-err').textContent = 'Please enter a valid GPA on a 4.0 scale.';
            document.getElementById('s-education').classList.add('has-error');
            ok = false;
        } else if (gpaNum < 2.0) {
            gpaEl.classList.add('has-error');
            document.getElementById('gpa-err').textContent = 'GPA must be 2.0 or higher to submit.';
            document.getElementById('s-education').classList.add('has-error');
            ok = false;
        }
    }

    // Investing club / student endowment
    const investingClubChecked = document.querySelector('input[name="investingClub"]:checked');
    if (!investingClubChecked) {
        document.getElementById('investingClub-err').textContent = 'Please select an option.';
        document.getElementById('s-education').classList.add('has-error');
        ok = false;
    } else if (investingClubChecked.value === 'Yes') {
        const orgInput = document.getElementById('investingClubOrg');
        if (!orgInput.value.trim()) {
            orgInput.classList.add('has-error');
            document.getElementById('investingClubOrg-err').textContent = 'Please list the organization and your position.';
            document.getElementById('s-education').classList.add('has-error');
            ok = false;
        }
    }

    // Test scores
    [
        { id: 'satMath',   label: 'SAT Math'   },
        { id: 'satVerbal', label: 'SAT Verbal' },
        { id: 'actScore',  label: 'ACT'        },
    ].forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
            el.classList.add('has-error');
            const errEl = el.nextElementSibling;
            if (errEl?.classList.contains('err-msg')) errEl.textContent = `${label} is required.`;
            document.getElementById('s-testscores').classList.add('has-error');
            ok = false;
        }
    });

    return ok;
}

function validatePage3() {
    // Clear all page 3 errors first
    document.querySelectorAll('#page-3 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-3 input, #page-3 select').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('#page-3 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    // Ethnicity — at least one checkbox
    if (!document.querySelectorAll('input[name="ethnicityBg"]:checked').length) {
        document.getElementById('ethnicityBg-err').textContent = 'Please select at least one option.';
        document.getElementById('s-background').classList.add('has-error');
        ok = false;
    }

    // Citizenship/Visa — at least one checkbox
    const citizenshipChecked = document.querySelectorAll('input[name="citizenshipVisa"]:checked');
    if (!citizenshipChecked.length) {
        document.getElementById('citizenshipVisa-err').textContent = 'Please select at least one option.';
        document.getElementById('s-background').classList.add('has-error');
        ok = false;
    } else if ([...citizenshipChecked].some(cb => cb.value === 'Visa: Other')) {
        const otherInput = document.getElementById('citizenshipVisaOther');
        if (!otherInput.value.trim()) {
            otherInput.classList.add('has-error');
            document.getElementById('citizenshipVisaOther-err').textContent = 'Please enter your visa type.';
            document.getElementById('s-background').classList.add('has-error');
            ok = false;
        }
    }

    // Gender Identity — at least one checkbox
    const genderChecked = document.querySelectorAll('input[name="gender"]:checked');
    if (!genderChecked.length) {
        document.getElementById('gender-err').textContent = 'Please select at least one option.';
        document.getElementById('s-background').classList.add('has-error');
        ok = false;
    } else if (document.getElementById('gender-let-me-type')?.checked) {
        const customInput = document.getElementById('genderCustom');
        if (!customInput.value.trim()) {
            customInput.classList.add('has-error');
            document.getElementById('genderCustom-err').textContent = 'Please describe yourself, or uncheck "Let me type."';
            document.getElementById('s-background').classList.add('has-error');
            ok = false;
        }
    }

    // Hometown State
    const hometownStateEl = document.getElementById('hometownState');
    if (!hometownStateEl.value) {
        hometownStateEl.classList.add('has-error');
        document.getElementById('hometownState-err').textContent = 'Please make a selection.';
        document.getElementById('s-background').classList.add('has-error');
        ok = false;
    }

    // Hometown Metro/Regional Area
    const hometownMetroEl = document.getElementById('hometownMetro');
    if (!hometownMetroEl.value) {
        hometownMetroEl.classList.add('has-error');
        document.getElementById('hometownMetro-err').textContent = 'Please make a selection.';
        document.getElementById('s-background').classList.add('has-error');
        ok = false;
    }

    return ok;
}

function validatePage4() {
    // Clear all page 4 errors first
    document.querySelectorAll('#page-4 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-4 input, #page-4 select, #page-4 textarea').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('#page-4 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    // Search interests — at least one checkbox
    if (!document.querySelectorAll('input[name="searchInterests"]:checked').length) {
        document.getElementById('searchInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-search-interests').classList.add('has-error');
        ok = false;
    }

    // Geographic interests — at least one checkbox
    if (!document.querySelectorAll('input[name="geoInterests"]:checked').length) {
        document.getElementById('geoInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-search-interests').classList.add('has-error');
        ok = false;
    }

    // Geographic preference selects
    [
        { id: 'geoPref1', label: 'top geographic preference' },
        { id: 'geoPref2', label: 'second choice geographic preference' },
        { id: 'geoPref3', label: 'third geographic preference' },
    ].forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.classList.add('has-error');
            document.getElementById(id + '-err').textContent = 'Please make a selection.';
            document.getElementById('s-search-interests').classList.add('has-error');
            ok = false;
        }
    });

    // Vertical interests — at least one checkbox
    if (!document.querySelectorAll('input[name="verticalInterests"]:checked').length) {
        document.getElementById('verticalInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-search-interests').classList.add('has-error');
        ok = false;
    }

    return ok;
}

function validatePage5() {
    // Clear all page 5 errors first
    document.querySelectorAll('#page-5 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-5 input').forEach(el => el.classList.remove('has-error', 'is-valid'));
    document.querySelectorAll('#page-5 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    // Start Date Preference — at least one checkbox
    if (!document.querySelectorAll('input[name="startDatePref"]:checked').length) {
        document.getElementById('startDatePref-err').textContent = 'Please select at least one option.';
        document.getElementById('s-page5').classList.add('has-error');
        ok = false;
    }

    // Summer 2028 On Cycle Recruiting
    if (!document.querySelector('input[name="onCycle2028"]:checked')) {
        document.getElementById('onCycle2028-err').textContent = 'Please select an option.';
        document.getElementById('s-page5').classList.add('has-error');
        ok = false;
    }

    // GCSP Client Interests — Megafund
    if (!document.querySelectorAll('input[name="megafundInterests"]:checked').length) {
        document.getElementById('megafundInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-page5').classList.add('has-error');
        ok = false;
    }

    // GCSP Client Interests — Middle Market/Growth
    if (!document.querySelectorAll('input[name="middleMarketInterests"]:checked').length) {
        document.getElementById('middleMarketInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-page5').classList.add('has-error');
        ok = false;
    }

    // GCSP Client Interests — Impact Investing
    if (!document.querySelectorAll('input[name="impactInvestingInterests"]:checked').length) {
        document.getElementById('impactInvestingInterests-err').textContent = 'Please select at least one option.';
        document.getElementById('s-page5').classList.add('has-error');
        ok = false;
    }

    return ok;
}

function validatePage6() {
    // Clear all page 6 errors first
    document.querySelectorAll('#page-6 .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#page-6 .form-section').forEach(el => el.classList.remove('has-error'));

    let ok = true;

    if (!resumeSatisfied()) {
        document.getElementById('resumeFile2026-err').textContent = 'Please upload your resume.';
        document.getElementById('s-additional-info').classList.add('has-error');
        ok = false;
    }

    return ok;
}


// ── NAVIGATION ────────────────────────────────────────────────────────────────

document.getElementById('next-btn')?.addEventListener('click', () => {
    if (!validatePage1()) {
        document.querySelector('#page-1 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    saveFormData();
    showPage(2);
});

document.getElementById('next-btn-2')?.addEventListener('click', () => {
    if (!validatePage2()) {
        document.querySelector('#page-2 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    saveFormData();
    showPage(3);
});

document.getElementById('next-btn-3')?.addEventListener('click', () => {
    if (!validatePage3()) {
        document.querySelector('#page-3 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    saveFormData();
    showPage(4);
});

document.getElementById('next-btn-4')?.addEventListener('click', () => {
    if (!validatePage4()) {
        document.querySelector('#page-4 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    saveFormData();
    showPage(5);
});

document.getElementById('next-btn-5')?.addEventListener('click', () => {
    if (!validatePage5()) {
        document.querySelector('#page-5 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    saveFormData();
    showPage(6);
});


// ── SUBMISSION EXPORT ─────────────────────────────────────────────────────────
// Each submission is POSTed to a Google Apps Script Web App tied to a Google
// Sheet ("Helpful/GoogleAppsScript_Code.gs" is the deployed script's source).
// The script itself appends the row and does the name+phone+email duplicate
// check server-side (against every row anyone has ever submitted, not just
// what this one browser has seen), returning { duplicate, saved } so this
// file only needs to react to that result. Sent as text/plain rather than
// application/json so the browser treats it as a "simple request" and skips
// the CORS preflight that Apps Script Web Apps don't handle.

const SUBMISSION_FIELDS = [
    // Page 1 — Candidate Information / Full Time Placement / Internship / Industry
    { label: 'First Name', id: 'firstName' },
    { label: 'Last Name', id: 'lastName' },
    { label: 'Nickname/Preferred Name', id: 'nickname' },
    { label: 'Personal Email', id: 'regEmail' },
    { label: 'School Email', id: 'schoolEmail' },
    { label: 'Mobile Phone', id: 'regPhone' },
    { label: 'LinkedIn URL', id: 'linkedinUrl' },
    { label: 'Full Time Bank/Firm', id: 'firmName', otherId: 'firmNameOther', otherValue: 'Other (not listed)' },
    { label: 'Vertical/Group', id: 'vertical2026' },
    { label: 'Full Time Office Location', id: 'officeLocation', otherId: 'officeLocationOther', otherValue: 'Other (not listed)' },
    { label: 'Analyst Program Start Date', id: 'startDate' },
    { label: 'Position at Start Date', id: 'position' },
    { label: 'Summer Intern', radioName: 'summerIntern', otherId: 'summerFirm', otherValue: 'No' },
    { label: 'Investing Internship', radioName: 'investingIntern', otherId: 'investingFirm', otherValue: 'Yes' },
    { label: 'Renewables Experience', radioName: 'renewables' },
    // Page 2 — Education / Test Scores
    { label: 'Degree(s)', checkboxName: 'degree' },
    { label: 'Undergrad Year', id: 'undergradYear' },
    { label: 'Expected Graduation Term', radioName: 'gradTerm', otherId: 'gradTermOther', otherValue: 'Other' },
    { label: 'Masters Grad Year', id: 'mastersGradYear' },
    { label: 'Undergraduate Institution', id: 'undergradInstitution', otherId: 'undergradInstitutionOther', otherValue: 'Other' },
    { label: 'GPA', id: 'gpa' },
    { label: 'Investing Club', radioName: 'investingClub', otherId: 'investingClubOrg', otherValue: 'Yes' },
    { label: 'Varsity Athletics', checkboxName: 'athletics' },
    { label: 'SAT Math', id: 'satMath' },
    { label: 'SAT Verbal', id: 'satVerbal' },
    { label: 'ACT', id: 'actScore' },
    { label: 'GMAT', id: 'gmat' },
    // Page 3 — Background
    { label: 'Ethnicity', checkboxName: 'ethnicityBg' },
    { label: 'Languages', checkboxName: 'languages' },
    { label: 'Citizenship/Visa', checkboxName: 'citizenshipVisa', otherId: 'citizenshipVisaOther', otherValue: 'Visa: Other' },
    { label: 'Gender Identity', checkboxName: 'gender', otherId: 'genderCustom', otherValue: 'Let me type' },
    { label: 'LGBTQ Community', radioName: 'lgbtq' },
    { label: 'Hometown State', id: 'hometownState' },
    { label: 'Hometown Metro/Regional Area', id: 'hometownMetro' },
    { label: 'Hometown City', id: 'hometownCity' },
    { label: 'Military Experience', checkboxName: 'militaryExperience' },
    // Page 4 — Search Interests
    { label: 'Search Interests', checkboxName: 'searchInterests' },
    { label: 'Geographic Interests', checkboxName: 'geoInterests' },
    { label: 'Top Geographic Preference', id: 'geoPref1' },
    { label: 'Second Geographic Preference', id: 'geoPref2' },
    { label: 'Third Geographic Preference', id: 'geoPref3' },
    { label: 'Vertical Interests', checkboxName: 'verticalInterests' },
    { label: 'Buyside Conversations', id: 'buysideDetails' },
    // Page 5 — no header
    { label: 'Start Date Preference', checkboxName: 'startDatePref' },
    { label: 'Summer 2028 On Cycle Interest', radioName: 'onCycle2028' },
    { label: 'Megafund Interests', checkboxName: 'megafundInterests' },
    { label: 'Middle Market/Growth Interests', checkboxName: 'middleMarketInterests' },
    { label: 'Impact Investing Interests', checkboxName: 'impactInvestingInterests' },
    // Page 6 — Additional Info
    { label: 'Other Incoming Analysts', id: 'otherAnalysts' },
    { label: 'Bank Group Staffer', id: 'bankStaffer' },
    { label: 'Final Question', id: 'finalQuestion' },
];

function collectSubmissionRow() {
    const row = {
        'Submitted At': new Date().toISOString(),
        'Class Year': classYear,
    };

    SUBMISSION_FIELDS.forEach(f => {
        let val = '';
        if (f.id) {
            val = document.getElementById(f.id)?.value.trim() || '';
        } else if (f.radioName) {
            val = document.querySelector(`input[name="${f.radioName}"]:checked`)?.value || '';
        } else if (f.checkboxName) {
            val = [...document.querySelectorAll(`input[name="${f.checkboxName}"]:checked`)].map(cb => cb.value).join('; ');
        }
        if (f.otherId && val === f.otherValue) {
            const otherVal = document.getElementById(f.otherId)?.value.trim();
            if (otherVal) val = `${val}: ${otherVal}`;
        }
        row[f.label] = val;
    });

    row['Resume Filename'] = resumeInput?.files[0]?.name || getForm1ResumeFileName() || '';

    return row;
}

const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby5rCo6ogeVUAujR_IGuU5kVTJOJGC34zLLLynlfBZBmS2fog_e1NZna6wnI9_oZeGp/exec';

async function submitRowToSheet(row, force) {
    const response = await fetch(SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ row, force }),
    });
    const result = await response.json();
    if (result.error) console.error('Google Sheet webhook error:', result.error);
    return result;
}

function showDuplicateWarning() {
    const overlay = document.getElementById('dup-modal-overlay');
    const cancelBtn = document.getElementById('dup-modal-cancel');
    const confirmBtn = document.getElementById('dup-modal-confirm');
    if (!overlay || !cancelBtn || !confirmBtn) return Promise.resolve(true);

    return new Promise(resolve => {
        const cleanup = () => {
            overlay.classList.remove('visible');
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirm);
        };
        const onCancel = () => { cleanup(); resolve(false); };
        const onConfirm = () => { cleanup(); resolve(true); };
        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
        overlay.classList.add('visible');
    });
}


// ── SUBMIT ────────────────────────────────────────────────────────────────────

document.getElementById('submit-btn')?.addEventListener('click', async () => {
    if (!validatePage6()) {
        document.querySelector('#page-6 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting…';

    try {
        const row = collectSubmissionRow();
        const result = await submitRowToSheet(row, false);

        if (result.duplicate) {
            const proceed = await showDuplicateWarning();
            if (!proceed) {
                btn.disabled = false;
                btn.querySelector('span').textContent = 'Submit Registration';
                return;
            }
            await submitRowToSheet(row, true);
        }
    } catch (e) {
        console.error('Could not save this submission to the Google Sheet:', e);
    }

    setTimeout(() => {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        document.getElementById('page-6').style.display = 'none';
        document.querySelector('.reg-title-block').style.display = 'none';
        document.querySelector('.step-track').style.display = 'none';
        document.querySelector('.completion-bar').style.display = 'none';
        document.querySelector('.form-intro')?.remove();
        document.getElementById('success-state').classList.add('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
});


// ── INIT ──────────────────────────────────────────────────────────────────────
restoreFormData();
initResumeDisplay();
showPage(1);
