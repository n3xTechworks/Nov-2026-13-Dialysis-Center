/* login: page-specific behaviour (shared behaviour lives in js/site.js) */
(function () {
  'use strict';
  var form = document.getElementById('loginForm');
  if (!form) return;
  var err = document.getElementById('login-error');
  var email = document.getElementById('l-email');
  var pw = document.getElementById('l-pw');
  var btn = document.getElementById('loginBtn');
  var DEMO = { email: 'michael.grant@example.com', password: 'Tidewell123', name: 'Michael Grant' };

  function accounts() { try { return JSON.parse(localStorage.getItem('tidewell-accounts')) || []; } catch (e) { return []; } }
  function check(e, p) {
    e = e.trim().toLowerCase();
    if (e === DEMO.email) return p === DEMO.password ? DEMO.name : null;
    var acc = accounts().filter(function (a) { return a.email === e; })[0];
    if (acc) return acc.password === p ? acc.name : null;
    return p === 'wrongpass' ? null : (e.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }));
  }
  function showError(msg) { err.querySelector('[data-error-text]').textContent = msg; err.hidden = false; setTimeout(function () { email.setAttribute('aria-invalid', 'true'); pw.setAttribute('aria-invalid', 'true'); }, 0); }
  function clearError() { err.hidden = true; }
  [email, pw].forEach(function (f) { f.addEventListener('input', clearError); });

  var remembered = null;
  try { remembered = localStorage.getItem('tidewell-remember'); } catch (e) { /* noop */ }
  if (remembered) { email.value = remembered; document.getElementById('l-remember').checked = true; }

  document.getElementById('useDemo').addEventListener('click', function () {
    email.value = DEMO.email; pw.value = DEMO.password; clearError();
    email.setAttribute('aria-invalid', 'false'); pw.setAttribute('aria-invalid', 'false');
    window.Tidewell && window.Tidewell.toast('Demo details filled in. Press Log in.', 'info');
    btn.focus();
  });

  form.addEventListener('form:success', function () {
    var name = check(email.value, pw.value);
    if (!name) { showError('Email or password is incorrect. Check them and try again, or reset your password.'); pw.focus(); pw.select(); return; }
    clearError();
    try {
      if (document.getElementById('l-remember').checked) localStorage.setItem('tidewell-remember', email.value.trim().toLowerCase()); else localStorage.removeItem('tidewell-remember');
      if (email.value.trim().toLowerCase() !== DEMO.email) {
        var parts = name.split(' ');
        var p = JSON.parse(localStorage.getItem('tidewell-profile') || 'null');
        if (!p || p.email !== email.value.trim().toLowerCase()) localStorage.setItem('tidewell-profile', JSON.stringify({ first: parts[0], last: parts.slice(1).join(' ') || 'Patient', email: email.value.trim().toLowerCase(), phone: '9840012345', centre: 'besant', passwordChanged: new Date().toISOString().slice(0, 10) }));
      }
    } catch (e) { /* noop */ }
    window.Tidewell.session.login(name, email.value.trim().toLowerCase());
    btn.classList.add('is-busy'); btn.textContent = 'Signing in...';
    window.Tidewell.toast('Welcome back, ' + name.split(' ')[0], 'ok');
    var next = new URLSearchParams(location.search).get('next');
    setTimeout(function () { location.href = (next && /^dashboard[\w-]*\.html$/.test(next)) ? next : 'dashboard.html'; }, 700);
  });
  form.addEventListener('submit', function () { if (!err.hidden) err.hidden = true; }, true);
  /* a failed login keeps the typed email; the password field is not reset by the shared validator on error because data-no-reset is set */
  form.setAttribute('data-no-reset', '');
})();
