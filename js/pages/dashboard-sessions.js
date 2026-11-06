/* dashboard-sessions: stats, filters, history table, detail drawer, CSV export */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var E = D.esc, PAGE = 12, limit = PAGE, all = D.sessions(), f = { status: 'all', month: 'all', centre: 'all' }, shown = [], cur = null;
    var $ = function (id) { return document.getElementById(id); };
    var dr = D.drawer('sDrawer');

    /* stats: last 30 days */
    var since = D.addDays(-30), recent = all.filter(function (s) { return s.date >= since; }), done = recent.filter(function (s) { return s.status !== 'missed'; });
    function avg(k) { return done.length ? done.reduce(function (a, s) { return a + s[k]; }, 0) / done.length : 0; }
    $('stats').innerHTML = [
      ['Sessions attended', done.length + '<small>of ' + recent.length + '</small>', 'Last 30 days'],
      ['Average Kt/V', avg('ktv').toFixed(2), 'Target 1.2 or higher'],
      ['Average fluid removed', avg('removed').toFixed(1) + '<small>L</small>', 'Per session'],
      ['Average time on machine', Math.round(avg('duration')) + '<small>min</small>', 'Prescribed 240 min']
    ].map(function (x) { return '<div class="stat-card"><span class="stat-label">' + x[0] + '</span><span class="stat-value">' + x[1] + '</span><span class="stat-hint">' + x[2] + '</span></div>'; }).join('');

    /* filter options */
    var months = [];
    all.forEach(function (s) { var m = s.date.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
    $('fMonth').innerHTML += months.map(function (m) { return '<option value="' + m + '">' + D.fmt(m + '-01', 'monthyear') + '</option>'; }).join('');
    $('fCentre').innerHTML += D.CENTRES.map(function (c) { return '<option value="' + c.key + '">' + E(c.name) + '</option>'; }).join('');

    function hm(min) { return Math.floor(min / 60) + 'h ' + (min % 60 ? (min % 60) + 'm' : '00m'); }
    function render() {
      shown = all.filter(function (s) { return (f.status === 'all' || s.status === f.status) && (f.month === 'all' || s.date.slice(0, 7) === f.month) && (f.centre === 'all' || s.centre === f.centre); });
      $('rows').innerHTML = shown.slice(0, limit).map(function (s) {
        var c = D.centre(s.centre), miss = s.status === 'missed';
        return '<tr tabindex="0" data-id="' + s.id + '" class="' + (miss ? 'is-missed' : '') + '"><td class="cell-strong">' + D.fmt(s.date, 'day') + '</td><td>' + E(c.short) + '</td>' +
          '<td class="num">' + (miss ? '–' : hm(s.duration)) + '</td><td class="num">' + (miss ? '–' : s.preWeight.toFixed(1) + ' / ' + s.postWeight.toFixed(1) + ' kg') + '</td>' +
          '<td class="num">' + (miss ? '–' : s.removed.toFixed(1) + ' L') + '</td><td class="num' + (!miss && s.ktv < 1.3 ? ' ktv-low' : '') + '">' + (miss ? '–' : s.ktv.toFixed(2)) + '</td>' +
          '<td>' + D.statusHtml(s.status) + '</td><td><button class="btn btn-secondary btn-sm" type="button" data-open="' + s.id + '">View</button></td></tr>';
      }).join('');
      $('noRows').hidden = shown.length > 0;
      document.querySelector('.sess-table').closest('.table-wrap').hidden = !shown.length;
      $('resultNote').textContent = 'Showing ' + Math.min(limit, shown.length) + ' of ' + shown.length + ' sessions';
      $('moreBtn').hidden = shown.length <= limit;
      $('moreBtn').textContent = 'Show ' + Math.min(PAGE, shown.length - limit) + ' more';
    }
    $('statusChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-status]'); if (!c) return;
      this.querySelectorAll('[data-status]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      f.status = c.getAttribute('data-status'); limit = PAGE; render();
    });
    $('fMonth').addEventListener('change', function () { f.month = this.value; limit = PAGE; render(); });
    $('fCentre').addEventListener('change', function () { f.centre = this.value; limit = PAGE; render(); });
    $('resetFilters').addEventListener('click', function () {
      f = { status: 'all', month: 'all', centre: 'all' }; $('fMonth').value = 'all'; $('fCentre').value = 'all';
      $('statusChips').querySelectorAll('[data-status]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-status') === 'all')); });
      render(); T.toast('Filters reset. Showing all sessions.', 'info');
    });

    $('moreBtn').addEventListener('click', function () { limit += PAGE; render(); T.toast('Loaded older sessions', 'info'); });

    /* drawer */
    function open(id, from) {
      cur = D.findSession(id); if (!cur) return;
      var s = cur, c = D.centre(s.centre), miss = s.status === 'missed';
      $('dr-title').textContent = D.fmt(s.date, 'long');
      $('drSub').innerHTML = E(s.time + ' · ' + c.name) + ' ' + D.statusHtml(s.status);
      $('drBody').innerHTML = miss ? '<div class="drawer-note">' + E(s.notes) + '</div>' :
        '<dl class="kv"><div><dt>Weight before</dt><dd>' + s.preWeight.toFixed(1) + ' kg</dd></div><div><dt>Weight after</dt><dd>' + s.postWeight.toFixed(1) + ' kg</dd></div>' +
        '<div><dt>Fluid removed</dt><dd>' + s.removed.toFixed(1) + ' L</dd></div><div><dt>Time on machine</dt><dd>' + hm(s.duration) + '</dd></div>' +
        '<div><dt>Kt/V (adequacy)</dt><dd>' + s.ktv.toFixed(2) + '</dd></div><div><dt>Chair</dt><dd>' + E(D.chair(s.chair).name) + '</dd></div></dl>' +
        '<div class="drawer-section"><h3>Blood pressure</h3><dl class="bp-row"><div><dt>Before</dt><dd>' + s.bpPre + ' mmHg</dd></div><div><dt>After</dt><dd>' + s.bpPost + ' mmHg</dd></div></dl></div>' +
        '<div class="drawer-section"><h3>Nurse notes</h3><div class="drawer-note">' + E(s.notes) + '<br><strong>' + E(s.nurse) + '</strong>, dialysis nurse</div></div>';
      dr.open(from);
    }
    $('rows').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) open(tr.getAttribute('data-id'), e.target.closest('button') || tr); });
    $('rows').addEventListener('keydown', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(tr.getAttribute('data-id'), tr); } });
    $('drDownload').addEventListener('click', function () {
      if (!cur) return; var s = cur;
      var txt = ['Tidewell Dialysis Centre: session summary', 'Date: ' + D.fmt(s.date, 'long') + ' ' + s.time, 'Centre: ' + D.centre(s.centre).name, 'Status: ' + s.status]
        .concat(s.status === 'missed' ? [] : ['Weight: ' + s.preWeight + ' kg to ' + s.postWeight + ' kg', 'Fluid removed: ' + s.removed + ' L', 'Duration: ' + s.duration + ' min', 'Kt/V: ' + s.ktv, 'BP: ' + s.bpPre + ' then ' + s.bpPost, 'Nurse: ' + s.nurse])
        .concat(['Notes: ' + s.notes]).join('\n');
      D.download('tidewell-session-' + s.date + '.txt', txt, 'text/plain');
      T.toast('Summary for ' + D.fmt(s.date, 'day') + ' downloaded', 'ok');
    });
    $('drQuery').addEventListener('click', function () { if (cur) T.toast('Question sent to ' + cur.nurse + '. They will reply in your messages.', 'ok'); dr.close(); });

    /* export */
    $('exportBtn').addEventListener('click', function () {
      if (!shown.length) { T.toast('Nothing to export. Change the filters first.', 'error'); return; }
      var rows = [['Date', 'Time', 'Centre', 'Status', 'Pre weight (kg)', 'Post weight (kg)', 'Fluid removed (L)', 'Duration (min)', 'BP before', 'BP after', 'Kt/V', 'Nurse', 'Notes']]
        .concat(shown.map(function (s) { return [s.date, s.time, D.centre(s.centre).name, s.status, s.preWeight, s.postWeight, s.removed, s.duration, s.bpPre, s.bpPost, s.ktv, s.nurse, s.notes]; }));
      var ok = D.download('tidewell-sessions-' + D.today() + '.csv', D.csv(rows), 'text/csv');
      var b = this; b.classList.add('is-busy'); b.textContent = 'Exporting...';
      setTimeout(function () { b.classList.remove('is-busy'); b.textContent = 'Export CSV'; T.toast(ok ? 'Exported ' + shown.length + ' sessions to CSV' : 'Export failed. Please try again.', ok ? 'ok' : 'error'); }, 500);
    });

    render();
  });
})();
