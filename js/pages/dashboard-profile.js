/* dashboard-profile: personal, medical, emergency forms; notification switches; security; delete account */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var $ = function (id) { return document.getElementById(id); }, E = D.esc;
    $('pf-centre').innerHTML = D.CENTRES.map(function (c) { return '<option value="' + c.key + '">' + E(c.name) + '</option>'; }).join('');
    $('pf-dob').max = D.today();
    $('md-since').max = D.today().slice(0, 7);

    var MAP = {
      personalForm: { 'pf-first': 'first', 'pf-last': 'last', 'pf-email': 'email', 'pf-phone': 'phone', 'pf-dob': 'dob', 'pf-centre': 'centre', 'pf-addr': 'address' },
      medForm: { 'md-blood': 'bloodGroup', 'md-since': 'since', 'md-dry': 'dryWeight', 'md-access': 'access', 'md-allergy': 'allergies' },
      emForm: { 'em-name': 'emName', 'em-rel': 'emRelation', 'em-phone': 'emPhone' }
    };
    function fill(formId) { var p = D.profile(), m = MAP[formId]; Object.keys(m).forEach(function (id) { var v = p[m[id]] || ''; if (id === 'md-since') v = String(v).slice(0, 7); $(id).value = v; $(id).setAttribute('aria-invalid', 'false'); }); }
    function paintHero() {
      var p = D.profile();
      $('profName').textContent = p.first + ' ' + p.last;
      $('profPhoto').alt = p.first + ' ' + p.last;
      $('profMeta').textContent = 'Patient ID ' + (p.patientId || 'pending') + ' · ' + D.centre(p.centre).name + (p.seat ? ' · ' + p.seat : '');
      $('profBadges').innerHTML = [p.treatment || 'In-centre haemodialysis', p.bloodGroup ? 'Blood group ' + p.bloodGroup : '', p.dryWeight ? 'Dry weight ' + p.dryWeight + ' kg' : '', p.since ? 'Since ' + D.fmt(String(p.since).slice(0, 7) + '-01', 'monthyear') : '']
        .filter(Boolean).map(function (t, i) { return '<span class="badge' + (i ? ' badge--sand' : '') + '">' + E(t) + '</span>'; }).join('');
      document.querySelectorAll('.avatar-name').forEach(function (n) { n.textContent = p.first; });
    }
    Object.keys(MAP).forEach(function (fid) {
      fill(fid);
      $(fid).addEventListener('form:success', function () {
        var p = D.profile(), m = MAP[fid];
        Object.keys(m).forEach(function (id) { p[m[id]] = $(id).value.trim(); });
        D.saveProfile(p); paintHero();
        T.toast($(fid).getAttribute('data-success-message'), 'ok');
      });
    });
    document.querySelectorAll('[data-discard]').forEach(function (b) {
      b.addEventListener('click', function () {
        var fid = b.getAttribute('data-discard'); fill(fid);
        $(fid).querySelectorAll('.field-error').forEach(function (e) { e.textContent = ''; });
        var ok = $(fid).querySelector('[data-form-success]'); if (ok) ok.hidden = true;
        T.toast('Changes discarded', 'info');
      });
    });
    /* dry weight: a number between 30 and 200 */
    $('medForm').addEventListener('submit', function (e) {
      var v = $('md-dry').value.trim();
      if (v && !(/^\d{2,3}(\.\d)?$/.test(v) && +v >= 30 && +v <= 200)) {
        e.preventDefault(); e.stopImmediatePropagation();
        $('md-dry-error').textContent = 'Enter your dry weight in kg, for example 68.5.'; $('md-dry').setAttribute('aria-invalid', 'true'); $('md-dry').focus();
      }
    }, true);
    $('photoBtn').addEventListener('click', function () { T.toast('Photo upload opens at the reception desk kiosk in this demo. Ask a nurse to retake it.', 'info'); });
    paintHero();

    /* notifications */
    var n = D.notify(), NAMES = { sessionSms: 'SMS session reminders', sessionEmail: 'Email session reminders', fluid: 'Daily fluid check-in', meds: 'Medicine reminders', labs: 'Lab result alerts', billing: 'Billing alerts', news: 'Kidney-care tips' };
    document.querySelectorAll('[data-notify]').forEach(function (sw) {
      var k = sw.getAttribute('data-notify'); sw.checked = !!n[k];
      sw.addEventListener('change', function () { var cur = D.notify(); cur[k] = sw.checked; D.saveNotify(cur); T.toast(NAMES[k] + (sw.checked ? ' turned on' : ' turned off'), 'ok'); });
    });

    /* security */
    var p = D.profile();
    $('pwChanged').textContent = 'Last changed ' + D.fmt(p.passwordChanged);
    $('tfaSwitch').checked = !!p.tfa; $('tfaText').textContent = p.tfa ? 'On, codes sent to your mobile' : 'Off';
    $('tfaSwitch').addEventListener('change', function () {
      var pr = D.profile(); pr.tfa = this.checked; D.saveProfile(pr);
      $('tfaText').textContent = this.checked ? 'On, codes sent to your mobile' : 'Off';
      T.toast(this.checked ? 'Two-step sign-in is on. We will text a code each time you log in.' : 'Two-step sign-in turned off', this.checked ? 'ok' : 'info');
    });
    $('signoutBtn').addEventListener('click', function () { this.disabled = true; $('devText').textContent = 'Only this browser'; T.toast('Signed out of 1 other device', 'ok'); });
    $('dataBtn').addEventListener('click', function () {
      var data = { profile: D.profile(), sessions: D.sessions(), upcoming: D.upcoming(), labs: D.LABS, invoices: D.invoices() };
      D.download('tidewell-my-data.json', JSON.stringify(data, null, 2), 'application/json');
      T.toast('Your data has been downloaded', 'ok');
    });
    $('pwForm').addEventListener('form:success', function () {
      var pr = D.profile(); pr.passwordChanged = D.today(); D.saveProfile(pr);
      $('pwChanged').textContent = 'Last changed ' + D.fmt(pr.passwordChanged);
      T.closeModal('m-pw'); T.toast('Password updated', 'ok');
    });

    /* delete */
    $('delForm').addEventListener('submit', function (e) {
      var v = $('del-confirm').value.trim();
      if (v && v !== 'DELETE') { e.preventDefault(); e.stopImmediatePropagation(); $('del-confirm-error').textContent = 'Type DELETE in capital letters to confirm.'; $('del-confirm').setAttribute('aria-invalid', 'true'); $('del-confirm').focus(); }
    }, true);
    $('delForm').addEventListener('form:success', function () {
      T.closeModal('m-delete');
      T.toast('Your account has been deleted. Taking you to the home page.', 'info');
      D.reset(); T.session.logout();
      setTimeout(function () { location.href = 'index.html'; }, 1400);
    });
  });
})();
