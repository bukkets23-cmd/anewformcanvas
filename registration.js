'use strict';

// ── READ YEAR FROM URL ────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const classYear = params.get('year') || '';

// Populate every place the year appears
document.getElementById('class-year').textContent    = classYear || '——';
document.getElementById('success-year').textContent  = classYear || '——';
document.title = classYear
    ? `Analyst Class of ${classYear} Registration — Gold Coast Search Partners`
    : 'Analyst Registration — Gold Coast Search Partners';


// ── PROGRESS ─────────────────────────────────────────────────────────────────
// Counts filled required fields. Expand this as real questions are added.

function countFilled() {
    let n = 0;
    document.querySelectorAll('#reg-form input[required], #reg-form select[required], #reg-form textarea[required]').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) n++;
        } else if (el.value.trim()) {
            n++;
        }
    });
    // Checkbox groups: count a group as 1 if any box in it is checked
    const groupNames = new Set();
    document.querySelectorAll('#reg-form input[type="checkbox"][data-group]').forEach(cb => groupNames.add(cb.dataset.group));
    groupNames.forEach(name => {
        if (document.querySelectorAll(`#reg-form input[data-group="${name}"]:checked`).length > 0) n++;
    });
    return n;
}

function getTotalRequired() {
    const singles = document.querySelectorAll(
        '#reg-form input[required]:not([type="checkbox"]):not([type="radio"]), #reg-form select[required], #reg-form textarea[required]'
    ).length;
    const groupNames = new Set();
    document.querySelectorAll('#reg-form input[type="checkbox"][data-group]').forEach(cb => groupNames.add(cb.dataset.group));
    return singles + groupNames.size;
}

function updateProgress() {
    const total = getTotalRequired();
    if (total === 0) { document.getElementById('completion-fill').style.width = '0%'; return; }
    const pct = Math.round((countFilled() / total) * 100);
    document.getElementById('completion-fill').style.width = pct + '%';
}

document.querySelectorAll('#reg-form input, #reg-form select, #reg-form textarea').forEach(el => {
    el.addEventListener('change', updateProgress);
    el.addEventListener('input', updateProgress);
});


// ── VALIDATION ────────────────────────────────────────────────────────────────

function clearAllErrors() {
    document.querySelectorAll('#reg-form .err-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('#reg-form input, #reg-form select, #reg-form textarea').forEach(el => {
        el.classList.remove('has-error', 'is-valid');
    });
    document.querySelectorAll('#reg-form .form-section').forEach(el => el.classList.remove('has-error'));
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

    // Validate all standard required inputs
    document.querySelectorAll('#reg-form input[required]:not([type="checkbox"]):not([type="radio"])').forEach(el => {
        if (!el.value.trim()) {
            markError(el, 'This field is required.');
            ok = false;
        } else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
            markError(el, 'Enter a valid email address.');
            ok = false;
        } else {
            el.classList.add('is-valid');
        }
    });

    // Validate checkbox groups (data-group attribute)
    const groupNames = new Set();
    document.querySelectorAll('#reg-form input[type="checkbox"][data-group]').forEach(cb => groupNames.add(cb.dataset.group));
    groupNames.forEach(name => {
        if (!document.querySelectorAll(`#reg-form input[data-group="${name}"]:checked`).length) {
            const errEl = document.getElementById(name + '-err');
            if (errEl) { errEl.textContent = 'Please select at least one option.'; ok = false; }
            document.querySelector(`#reg-form input[data-group="${name}"]`)
                ?.closest('.form-section')?.classList.add('has-error');
        }
    });

    return ok;
}


// ── SUBMIT ────────────────────────────────────────────────────────────────────

document.getElementById('reg-form')?.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) {
        document.querySelector('#reg-form .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting…';

    setTimeout(() => {
        document.getElementById('reg-form').style.display = 'none';
        const success = document.getElementById('success-state');
        success.classList.add('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
});


// ── INIT ──────────────────────────────────────────────────────────────────────
updateProgress();
