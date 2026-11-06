/* signup: page-specific behaviour (shared behaviour lives in js/site.js) */
(function () {
  'use strict';
  var form = document.getElementById('suForm');
  if (!form) return;
  var steps = document.querySelectorAll('[data-su-step]');
  var crumbs = document.querySelectorAll('#suSteps li');
  var title = document.getElementById('auth-title');
  var sub = document.getElementById('suSub');
  var HEAD = [
    ['Create your account', 'Free to use. We never sell your data.'],
    ['Verify your email', 'One quick check so we know it is really you.'],
    ['Make it yours', 'Optional, and you can change it later in your profile.']
  ];
  var account = null;

  function go(n) {
    steps.forEach(function (s) { s.hidden = s.getAttribute('data-su-step') !== String(n); });
    crumbs.forEach(function (li, i) { li.classList.toggle('is-done', i < n - 1); li.classList.toggle('is-current', i === n - 1); });
    title.textContent = HEAD[n - 1][0]; sub.textContent = HEAD[n - 1][1];
    var first = document.querySelector('[data-su-step="' + n + '"] input, [data-su-step="' + n + '"] select');
    if (first && n > 1) first.focus();
    window.scrollTo({ top: 0 });
  }

  /* password strength */
  var pw = document.getElementById('s-pw'), meter = document.getElementById('pwMeter'), hint = document.getElementById('pwHint');
  var LABELS = ['At least 8 characters, with a letter and a number.', 'Weak: add more characters.', 'Fair: add a number or symbol.', 'Good password.', 'Strong password.'];
  pw.addEventListener('input', function () {
    var v = pw.value, score = 0;
    if (v.length >= 8) score++;
    if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
    if (v.length >= 12) score++;
    if (/[^A-Za-z0-9]/.test(v) && /[A-Z]/.test(v)) score++;
    if (!v) score = 0; else if (score === 0) score = 1;
    meter.setAttribute('data-level', String(score));
    hint.textContent = LABELS[score];
  });

  form.addEventListener('form:success', function () {
    var f = form.elements;
    account = { name: f['first-name'].value.trim() + ' ' + f['last-name'].value.trim(), first: f['first-name'].value.trim(), last: f['last-name'].value.trim(), email: f.email.value.trim().toLowerCase(), phone: f.phone.value.trim(), password: f['new-password'].value };
    document.getElementById('verifyEmail').textContent = account.email;
    window.Tidewell.toast('Verification code sent to ' + account.email, 'info');
    go(2);
  });

  /* 6-digit code */
  var inputs = Array.prototype.slice.call(document.querySelectorAll('.code-input'));
  var codeErr = document.getElementById('codeError');
  function code() { return inputs.map(function (i) { return i.value; }).join(''); }
  inputs.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      inputs.forEach(function (x) { x.setAttribute('aria-invalid', 'false'); }); codeErr.textContent = '';
      if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) { inputs[i - 1].focus(); inputs[i - 1].value = ''; }
      if (e.key === 'ArrowLeft' && inputs[i - 1]) inputs[i - 1].focus();
      if (e.key === 'ArrowRight' && inputs[i + 1]) inputs[i + 1].focus();
    });
    inp.addEventListener('paste', function (e) {
      var t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (!t) return; e.preventDefault();
      t.split('').forEach(function (c, k) { if (inputs[k]) inputs[k].value = c; });
      inputs[Math.min(t.length, 5)].focus();
    });
  });
  document.getElementById('verifyForm').addEventListener('form:success', function () {
    var c = code();
    if (c.length < 6) { codeErr.textContent = 'Enter all 6 digits of the code.'; inputs.forEach(function (x) { x.setAttribute('aria-invalid', x.value ? 'false' : 'true'); }); (inputs.filter(function (x) { return !x.value; })[0] || inputs[0]).focus(); return; }
    window.Tidewell.toast('Email verified', 'ok');
    go(3);
  });
  document.getElementById('resendCode').addEventListener('click', function (e) {
    var b = e.currentTarget; if (b.disabled) return;
    b.disabled = true; var n = 30;
    window.Tidewell.toast('A new code is on its way', 'info');
    var t = setInterval(function () { n--; b.textContent = n > 0 ? 'Resend code in ' + n + 's' : 'Resend code'; if (n <= 0) { clearInterval(t); b.disabled = false; } }, 1000);
    b.textContent = 'Resend code in ' + n + 's';
  });
  document.querySelector('[data-su-back]').addEventListener('click', function () { go(1); form.elements.email.focus(); });

  /* preferences */
  document.getElementById('prefChips').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    this.querySelectorAll('.chip').forEach(function (x) { var on = x === c; x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-checked', String(on)); });
  });
  function finish(skip) {
    var D = window.Tidewell, pref = document.getElementById('prefForm');
    var accs = []; try { accs = JSON.parse(localStorage.getItem('tidewell-accounts')) || []; } catch (e) { /* noop */ }
    accs = accs.filter(function (a) { return a.email !== account.email; });
    accs.push({ email: account.email, password: account.password, name: account.name });
    try {
      localStorage.setItem('tidewell-accounts', JSON.stringify(accs));
      localStorage.setItem('tidewell-profile', JSON.stringify({ first: account.first, last: account.last, email: account.email, phone: account.phone, centre: skip ? 'besant' : pref.elements.centre.value, treatment: skip ? 'In-centre haemodialysis' : (document.querySelector('#prefChips [aria-pressed="true"]') || {}).getAttribute('data-v'), bloodGroup: '', since: '', dryWeight: '', access: '', patientId: 'TW-' + Math.floor(20500 + Math.random() * 900), passwordChanged: new Date().toISOString().slice(0, 10) }));
      localStorage.setItem('tidewell-notify', JSON.stringify({ sessionSms: skip ? true : pref.elements.sms.checked, sessionEmail: true, fluid: true, meds: true, labs: true, billing: false, news: skip ? false : pref.elements.launch.checked }));
    } catch (e) { /* noop */ }
    D.session.login(account.name, account.email);
    D.toast('Account created. Welcome to Tidewell, ' + account.first + '.', 'ok');
    setTimeout(function () { location.href = 'dashboard.html'; }, 800);
  }
  document.getElementById('prefForm').addEventListener('form:success', function () { if (account) finish(false); });
  document.getElementById('skipPref').addEventListener('click', function () { if (account) finish(true); });
})();
