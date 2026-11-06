/* forgot-password: page-specific behaviour (shared behaviour lives in js/site.js) */
(function () {
  'use strict';
  var form = document.getElementById('fpForm');
  if (!form) return;
  var formPane = document.querySelector('[data-fp="form"]'), sent = document.querySelector('[data-fp="sent"]');
  form.addEventListener('form:success', function () {
    document.getElementById('fpEmail').textContent = form.elements.email.value.trim().toLowerCase();
    formPane.hidden = true; sent.hidden = false;
    window.Tidewell.toast('Reset link sent', 'ok');
    var link = sent.querySelector('a'); if (link) link.focus();
  });
  document.getElementById('fpResend').addEventListener('click', function (e) {
    var b = e.currentTarget; b.disabled = true; var n = 20;
    window.Tidewell.toast('We sent the email again', 'info');
    b.textContent = 'Resend in ' + n + 's';
    var t = setInterval(function () { n--; b.textContent = n > 0 ? 'Resend in ' + n + 's' : 'Resend email'; if (n <= 0) { clearInterval(t); b.disabled = false; } }, 1000);
  });
})();
