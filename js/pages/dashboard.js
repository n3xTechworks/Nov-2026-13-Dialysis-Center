/* dashboard (overview): greeting, next session, monthly ring, lab mini chart, reminders, care team, invoices */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var E = D.esc, p = D.profile();

    /* greeting */
    var h = new Date().getHours();
    document.getElementById('greet').textContent = (h < 12 ? 'Good morning, ' : h < 17 ? 'Good afternoon, ' : 'Good evening, ') + p.first;
    document.getElementById('greetSub').textContent = 'Patient ID ' + (p.patientId || 'pending') + ' · ' + D.centre(p.centre).name + '. Here is what is coming up in your care.';
    document.querySelector('.ov-avatar').alt = p.first + ' ' + p.last;

    /* next session */
    function rel(date) {
      var n = Math.round((D.parse(date) - D.parse(D.today())) / 864e5);
      return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days';
    }
    function renderNext() {
      var b = D.upcoming()[0], box = document.getElementById('nextSession');
      if (!b) {
        document.getElementById('nextStatus').innerHTML = '';
        box.innerHTML = '<div class="empty"><h3>No sessions booked</h3><p>Book your next dialysis session to keep your routine on track.</p><a class="btn btn-primary" href="dashboard-schedule.html">Book a session</a></div>';
        return;
      }
      var d = D.parse(b.date), c = D.centre(b.centre), ch = D.chair(b.chair);
      document.getElementById('nextStatus').innerHTML = D.statusHtml('confirmed');
      box.innerHTML = '<div class="next-when"><div class="next-date"><small>' + D.DAYS[d.getDay()] + '</small><strong>' + d.getDate() + '</strong><small>' + D.MONTHS[d.getMonth()] + '</small></div>' +
        '<div class="next-info"><p class="countdown">' + rel(b.date) + '</p><h3>' + E(b.time) + ' to ' + D.endTime(b.time) + '</h3><p>' + E(c.name) + ', ' + E(c.address) + '</p></div></div>' +
        '<div class="next-meta"><span class="badge">' + E(ch.name) + '</span><span class="badge badge--sand">' + E(D.shiftOf(b.time).name) + ' shift</span>' +
        (b.transport ? '<span class="badge badge--ok">Pickup booked</span>' : '<span class="badge badge--neutral">No transport</span>') + '<span class="badge badge--neutral">Ref ' + E(b.ref) + '</span></div>' +
        '<div class="next-actions"><button class="btn btn-secondary btn-sm" type="button" id="nxCal">Add to calendar</button>' +
        '<button class="btn btn-secondary btn-sm" type="button" id="nxTransport">' + (b.transport ? 'Cancel pickup' : 'Request pickup') + '</button>' +
        '<a class="btn btn-primary btn-sm" href="dashboard-schedule.html?reschedule=' + b.id + '">Reschedule</a></div>';
      document.getElementById('nxCal').addEventListener('click', function () { D.downloadIcs(b); });
      document.getElementById('nxTransport').addEventListener('click', function () {
        D.updateBooking(b.id, { transport: !b.transport });
        T.toast(b.transport ? 'Pickup cancelled for ' + D.fmt(b.date, 'day') : 'Pickup requested. The driver will call you 30 minutes before ' + b.time + '.', b.transport ? 'info' : 'ok');
        renderNext();
      });
    }
    renderNext();

    /* sessions this month ring */
    (function () {
      var now = new Date(), ym = D.today().slice(0, 7), planned = 0, d = new Date(now.getFullYear(), now.getMonth(), 1, 12);
      while (d.getMonth() === now.getMonth()) { var w = d.getDay(); if (w === 1 || w === 3 || w === 5) planned++; d.setDate(d.getDate() + 1); }
      var mine = D.sessions().filter(function (s) { return s.date.slice(0, 7) === ym; });
      var done = mine.filter(function (s) { return s.status !== 'missed'; }).length, missed = mine.length - done;
      var ahead = D.upcoming().filter(function (b) { return b.date.slice(0, 7) === ym; }).length;
      planned = Math.max(planned, done + missed + ahead);
      var pct = planned ? Math.round(done / planned * 100) : 0;
      var ring = document.getElementById('monthRing');
      document.getElementById('ringDone').textContent = done;
      document.getElementById('ringOf').textContent = 'of ' + planned + ' sessions';
      ring.setAttribute('aria-label', done + ' of ' + planned + ' sessions completed in ' + D.fmt(D.today(), 'monthyear'));
      requestAnimationFrame(function () { ring.style.setProperty('--p', pct); });
      document.getElementById('ringLegend').innerHTML = '<li><i></i>Completed<strong>' + done + '</strong></li><li class="l-left"><i></i>Booked ahead<strong>' + ahead + '</strong></li><li class="l-miss"><i></i>Missed<strong>' + missed + '</strong></li>' +
        '<li><a class="link" href="dashboard-sessions.html">Session history</a></li>';
    })();

    /* this week: Mon to Sun with session state */
    (function () {
      var t = D.today(), w = D.dow(t), mon = D.addDays(-(w === 0 ? 6 : w - 1)), ses = D.sessions(), bk = D.upcoming(), html = '';
      var ICON = { done: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>', booked: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>', missed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>' };
      for (var i = 0; i < 7; i++) {
        var d = D.addDays(i, mon), s = ses.filter(function (x) { return x.date === d; })[0], b = bk.filter(function (x) { return x.date === d; })[0];
        var st = s ? (s.status === 'missed' ? 'missed' : 'done') : b ? 'booked' : '';
        var lbl = st === 'done' ? 'session completed' : st === 'missed' ? 'session missed' : st === 'booked' ? 'session booked at ' + b.time : 'no session';
        html += '<li class="' + (st ? 'is-' + st : '') + (d === t ? ' is-today' : '') + '"><i>' + (ICON[st] || '') + '</i><span>' + D.DAYS[D.dow(d)] + '</span><span class="sr-only">' + D.fmt(d, 'day') + ', ' + lbl + '</span></li>';
      }
      document.getElementById('weekDots').innerHTML = html;
    })();

    /* latest labs */
    function renderLab(key) {
      var m = D.METRICS[key], vals = D.LABS.map(function (l) { return l[key]; }), last = vals[vals.length - 1], prev = vals[vals.length - 2];
      var diff = Math.round((last - prev) * 100) / 100;
      document.getElementById('labNow').innerHTML = '<strong>' + last + (m.unit ? ' <small class="unit">' + E(m.unit) + '</small>' : '') + '</strong>' +
        (m.ok(last) ? '<span class="status status--ok">In target range</span>' : '<span class="status status--warn">Outside target</span>') +
        '<span>' + (diff === 0 ? 'No change' : (diff > 0 ? 'Up ' : 'Down ') + Math.abs(diff)) + ' since ' + D.fmt(D.LABS[D.LABS.length - 2].date, 'month') + '. Target ' + E(m.range) + '.</span>';
      T.lineChart(document.getElementById('labChart'), { label: m.label, unit: m.unit, labels: D.LABS.map(function (l) { return D.fmt(l.date, 'month'); }), values: vals, target: m.target, targetLabel: m.targetLabel });
    }
    document.getElementById('labChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-metric]'); if (!c) return;
      this.querySelectorAll('[data-metric]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      renderLab(c.getAttribute('data-metric'));
    });
    renderLab('hb');
    var L = D.LABS[D.LABS.length - 1];
    document.getElementById('labKv').innerHTML = ['hb', 'k', 'phos', 'alb'].map(function (k) {
      var m = D.METRICS[k]; return '<div><dt>' + E(m.label) + '</dt><dd>' + L[k] + ' <small>' + E(m.unit) + '</small></dd></div>';
    }).join('');

    /* fluid tracker */
    var LIMIT = D.FLUID_LIMIT;
    function renderFluid() {
      var f = D.fluid(), pct = Math.min(100, Math.round(f.ml / LIMIT * 100)), bar = document.getElementById('fluidBar');
      bar.querySelector('span').style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(f.ml));
      bar.classList.toggle('is-over', f.ml > LIMIT);
      document.getElementById('fluidText').textContent = f.ml.toLocaleString('en-IN') + ' of ' + LIMIT.toLocaleString('en-IN') + ' ml today' + (f.ml > LIMIT ? ' (over your limit)' : ', ' + (LIMIT - f.ml).toLocaleString('en-IN') + ' ml left');
      document.getElementById('fluidUndo').disabled = !(f.log && f.log.length);
    }
    document.querySelectorAll('[data-fluid]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = D.fluid(), add = +b.getAttribute('data-fluid');
        f.ml += add; f.log = (f.log || []).concat(add); D.saveFluid(f); renderFluid();
        if (f.ml > LIMIT) T.toast('You are ' + (f.ml - LIMIT) + ' ml over today\'s allowance. Try ice chips or a mouth rinse if you feel thirsty.', 'info');
        else T.toast(add + ' ml logged. ' + (LIMIT - f.ml) + ' ml left today.', 'ok');
      });
    });
    document.getElementById('fluidUndo').addEventListener('click', function () {
      var f = D.fluid(); if (!f.log || !f.log.length) return;
      f.ml -= f.log.pop(); D.saveFluid(f); renderFluid(); T.toast('Last drink removed', 'info');
    });
    renderFluid();

    /* medicines today */
    var doses = [];
    D.PRESCRIPTIONS.forEach(function (rx) { rx.times.forEach(function (t) { doses.push({ key: rx.name + '@' + t, name: rx.name, time: t, dose: rx.dose }); }); });
    doses.sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    function renderMeds() {
      var taken = D.medsTaken().taken;
      document.getElementById('medList').innerHTML = doses.map(function (m, i) {
        var on = taken.indexOf(m.key) > -1;
        return '<li class="' + (on ? 'is-done' : '') + '"><span class="med-txt"><strong>' + E(m.time) + ' · ' + E(m.name) + '</strong><span>' + E(m.dose) + '</span></span>' +
          '<button class="btn btn-secondary btn-sm" type="button" data-med="' + i + '">' + (on ? 'Undo' : 'Mark taken') + '</button></li>';
      }).join('');
    }
    document.getElementById('medList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-med]'); if (!b) return;
      var m = doses[+b.getAttribute('data-med')], st = D.medsTaken(), i = st.taken.indexOf(m.key);
      if (i > -1) { st.taken.splice(i, 1); T.toast(m.name + ' at ' + m.time + ' marked as not taken', 'info'); }
      else { st.taken.push(m.key); T.toast(m.name + ' at ' + m.time + ' marked as taken', 'ok'); }
      D.saveMedsTaken(st); renderMeds();
    });
    renderMeds();

    /* care team */
    var msgTo = null;
    document.getElementById('teamList').innerHTML = D.CARE_TEAM.map(function (c, i) {
      return '<li><span class="initials" aria-hidden="true">' + E(c.initials) + '</span><span class="t-txt"><strong>' + E(c.name) + '</strong><span>' + E(c.role) + ' · ' + E(c.when) + '</span></span>' +
        '<span class="t-acts"><a class="btn btn-secondary btn-sm" href="tel:' + c.phone.replace(/\s/g, '') + '" aria-label="Call ' + E(c.name) + '">Call</a><button class="btn btn-secondary btn-sm" type="button" data-msg="' + i + '">Message</button></span></li>';
    }).join('');
    document.getElementById('teamList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-msg]'); if (!b) return;
      msgTo = D.CARE_TEAM[+b.getAttribute('data-msg')];
      document.getElementById('m-message-title').textContent = 'Message ' + msgTo.name;
      T.openModal('m-message', b);
    });
    document.getElementById('msgForm').addEventListener('form:success', function () {
      T.closeModal('m-message');
      T.toast('Message sent to ' + (msgTo ? msgTo.name : 'your care team') + '. Expect a reply within one working day.', 'ok');
    });

    /* invoices */
    document.getElementById('invList').innerHTML = D.invoices().slice(0, 3).map(function (v) {
      var st = D.invStatus(v), you = v.total - v.covered;
      return '<div class="row-item"><div class="row-main"><strong>' + E(v.desc) + '</strong><span>' + E(v.id) + ' · ' + D.fmt(v.date) + '</span></div>' +
        '<div class="inv-right"><span class="inv-amt">' + D.inr(you) + '</span>' + D.statusHtml(st) +
        (st === 'due' || st === 'overdue' ? '<a class="btn btn-primary btn-sm" href="dashboard-billing.html?pay=' + v.id + '">Pay</a>' : '') + '</div></div>';
    }).join('');
  });
})();
