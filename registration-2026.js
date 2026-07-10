'use strict';

// ── YEAR FROM URL ─────────────────────────────────────────────────────────────
const params    = new URLSearchParams(window.location.search);
const classYear = params.get('year') || '2026';
document.getElementById('class-year').textContent = classYear;
document.title = `Analyst Class of ${classYear} Registration — Gold Coast Search Partners`;


// ── PAGE STATE ────────────────────────────────────────────────────────────────
let currentPage = 1;
const TOTAL_PAGES = 2;

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
    };
    document.getElementById('page-subtitle').textContent = subtitles[n] || `Page ${n}`;
    currentPage = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('back-btn')?.addEventListener('click', () => showPage(1));


// ── PHONE FORMATTING ──────────────────────────────────────────────────────────
document.getElementById('regPhone')?.addEventListener('input', function () {
    let raw = this.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length >= 7)      this.value = `(${raw.slice(0,3)}) ${raw.slice(3,6)}-${raw.slice(6)}`;
    else if (raw.length >= 4) this.value = `(${raw.slice(0,3)}) ${raw.slice(3)}`;
    else if (raw.length > 0)  this.value = `(${raw}`;
    else                      this.value = raw;
});


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

// Firm / office location selects: show a text box when "Other (not listed)" is chosen
function wireOtherReveal(selectId, revealId, otherInputId, otherErrId) {
    const select = document.getElementById(selectId);
    select?.addEventListener('change', function () {
        const reveal = document.getElementById(revealId);
        const otherInput = document.getElementById(otherInputId);
        if (this.value === 'Other (not listed)') {
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


// ── PROGRESS ─────────────────────────────────────────────────────────────────
// Counts Page 1 required fields only (progress bar scoped to current page)

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

function updateProgress() {
    const pct = Math.round((countPage1Filled() / PAGE1_TOTAL) * 100);
    document.getElementById('completion-fill').style.width = Math.min(pct, 100) + '%';
}

document.querySelectorAll('#page-1 input, #page-1 select').forEach(el => {
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
document.querySelectorAll('#page-1 input[type="text"], #page-1 input[type="email"], #page-1 input[type="tel"], #page-1 input[type="date"]').forEach(el => {
    el.addEventListener('input', () => clearInputError(el));
});
document.querySelectorAll('#page-1 select').forEach(el => {
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
    // No required fields on Page 2 yet — returns true until questions are added
    return true;
}


// ── NAVIGATION ────────────────────────────────────────────────────────────────

document.getElementById('next-btn')?.addEventListener('click', () => {
    if (!validatePage1()) {
        document.querySelector('#page-1 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    showPage(2);
});


// ── SUBMIT ────────────────────────────────────────────────────────────────────

document.getElementById('submit-btn')?.addEventListener('click', () => {
    if (!validatePage2()) {
        document.querySelector('#page-2 .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting…';

    setTimeout(() => {
        document.getElementById('page-2').style.display = 'none';
        document.querySelector('.reg-title-block').style.display = 'none';
        document.querySelector('.step-track').style.display = 'none';
        document.querySelector('.completion-bar').style.display = 'none';
        document.querySelector('.form-intro')?.remove();
        document.getElementById('success-state').classList.add('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
});


// ── INIT ──────────────────────────────────────────────────────────────────────
showPage(1);
updateProgress();
