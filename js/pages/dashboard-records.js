/* dashboard-records: metric toggle + SVG trend, lab table, prescriptions, documents, share modal */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var E = D.esc, $ = function (id) { return document.getElementById(id); }, KEYS = ['hb', 'k', 'phos', 'alb', 'ktv'];
    var TIPS = {
      hb: 'Haemoglobin carries oxygen. Your EPO injections and iron keep it steady; tiredness and breathlessness can mean it is low.',
      k: 'Potassium above 5.5 can upset the heart rhythm. Leach vegetables and go easy on bananas, coconut water and tomatoes.',
      phos: 'Phosphate binders work only when taken with meals. High phosphate weakens bones and can cause itching.',
      alb: 'Albumin reflects nutrition. Protein at every meal (eggs, paneer, dal in measured portions) helps keep it up.',
      ktv: 'Kt/V shows how well each session cleans your blood. Staying the full four hours keeps it above 1.2.'
    };

    $('metricChips').innerHTML = KEYS.map(function (k, i) { return '<button class="chip" type="button" data-metric="' + k + '" aria-pressed="' + (i === 0) + '">' + E(D.METRICS[k].label.replace(/ \(.*\)/, '')) + '</button>'; }).join('');
    function trend(k) {
      var m = D.METRICS[k], v = D.LABS.map(function (l) { return l[k]; }), last = v[v.length - 1], first = v[0];
      T.lineChart($('trendChart'), { label: m.label, unit: m.unit, labels: D.LABS.map(function (l) { return D.fmt(l.date, 'month'); }), values: v, target: m.target, targetLabel: m.targetLabel });
      $('trendSide').innerHTML = '<div class="trend-big"><span>Latest, ' + D.fmt(D.LABS[D.LABS.length - 1].date) + '</span><strong>' + last + (m.unit ? ' <small>' + E(m.unit) + '</small>' : '') + '</strong>' +
        (m.ok(last) ? '<span class="status status--ok">In target range</span>' : '<span class="status status--warn">Outside target</span>') + '<span>Target ' + E(m.range) + '</span></div>' +
        '<p class="trend-tip">' + E(TIPS[k]) + '</p>';
      $('trendNote').textContent = '6 months: ' + first + ' to ' + last + (m.unit ? ' ' + m.unit : '');
    }
    $('metricChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-metric]'); if (!c) return;
      this.querySelectorAll('[data-metric]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      trend(c.getAttribute('data-metric'));
    });
    trend('hb');

    /* table (newest first) */
    $('labRows').innerHTML = D.LABS.slice().reverse().map(function (l) {
      return '<tr><td class="cell-strong">' + D.fmt(l.date) + '</td>' + ['hb', 'k', 'phos', 'alb', 'ktv'].map(function (k) {
        var bad = !D.METRICS[k].ok(l[k]);
        return '<td class="num' + (bad ? ' is-flag' : '') + '">' + (k === 'ktv' ? l[k].toFixed(2) : l[k]) + (bad ? '<span class="sr-only"> (outside target)</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    $('labCsv').addEventListener('click', function () {
      var rows = [['Date', 'Haemoglobin (g/dL)', 'Potassium (mmol/L)', 'Phosphate (mg/dL)', 'Albumin (g/dL)', 'Kt/V']].concat(D.LABS.map(function (l) { return [l.date, l.hb, l.k, l.phos, l.alb, l.ktv]; }));
      D.download('tidewell-lab-results.csv', D.csv(rows), 'text/csv');
      T.toast('Lab results downloaded (' + D.LABS.length + ' months)', 'ok');
    });

    /* prescriptions */
    $('rxCount').textContent = D.PRESCRIPTIONS.length + ' active';
    $('rxList').innerHTML = D.PRESCRIPTIONS.map(function (r, i) {
      return '<div class="row-item"><div class="row-lead"><span class="doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="7" rx="3.5" transform="rotate(-45 12 12.5)"/><path d="m9.5 10 5 5"/></svg></span>' +
        '<div class="row-main"><strong>' + E(r.name) + '</strong><span>' + E(r.dose) + '</span><div class="rx-meta"><span class="badge badge--sand">' + E(r.purpose) + '</span>' +
        (r.refill ? '<span class="badge badge--neutral">' + r.refill + ' days left</span>' : '<span class="badge badge--ok">Given at dialysis</span>') + '</div></div></div>' +
        (r.refill ? '<button class="btn btn-secondary btn-sm" type="button" data-refill="' + i + '">Request refill</button>' : '') + '</div>';
    }).join('');
    $('rxList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-refill]'); if (!b) return;
      var r = D.PRESCRIPTIONS[+b.getAttribute('data-refill')];
      b.disabled = true; b.textContent = 'Requested';
      T.toast('Refill for ' + r.name + ' requested. Collect it at the pharmacy desk after your next session.', 'ok');
    });

    /* care plan + documents */
    var p = D.profile();
    $('carePlan').innerHTML = '<h3>Your care plan at a glance</h3><ul><li>In-centre haemodialysis, 3 times a week, 4 hours</li><li>Dry weight ' + E(p.dryWeight || '68.5') + ' kg, fluid allowance 1 litre a day</li>' +
      '<li>Access: ' + E(p.access || 'AV fistula') + '</li><li>Next review with ' + E(p.nephrologist || 'Dr Mei Lin Chua') + ' on ' + D.fmt(D.addDays(9), 'long') + '</li></ul>';
    $('docList').innerHTML = D.DOCUMENTS.map(function (d, i) {
      return '<div class="row-item"><div class="row-lead"><span class="doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg></span>' +
        '<div class="row-main"><strong>' + E(d.name) + '</strong><span>' + d.type + ' · ' + d.size + ' · ' + D.fmt(d.date) + '</span></div></div>' +
        '<button class="btn btn-secondary btn-sm" type="button" data-doc="' + i + '" aria-label="Download ' + E(d.name) + '">Download</button></div>';
    }).join('');
    $('docList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-doc]'); if (!b) return;
      var d = D.DOCUMENTS[+b.getAttribute('data-doc')];
      b.classList.add('is-busy'); b.textContent = 'Preparing...';
      setTimeout(function () {
        D.download(d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt', 'Tidewell Dialysis Centre\n' + d.name + '\nPatient: ' + p.first + ' ' + p.last + ' (' + p.patientId + ')\nIssued: ' + D.fmt(d.date) + '\n\nDemo document: the real file is available from the unit.', 'text/plain');
        b.classList.remove('is-busy'); b.textContent = 'Downloaded';
        T.toast(d.name + ' downloaded', 'ok');
      }, 450);
    });

    /* share modal */
    var form = $('shareForm'), boxes = form.querySelectorAll('.share-checks input');
    form.addEventListener('submit', function (e) {
      var any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
      $('shWhatErr').textContent = any ? '' : 'Choose at least one thing to share.';
      if (!any) { e.stopImmediatePropagation(); e.preventDefault(); boxes[0].focus(); }
    }, true);
    boxes.forEach(function (b) { b.addEventListener('change', function () { $('shWhatErr').textContent = ''; }); });
    form.addEventListener('form:success', function () {
      var who = form.elements['doctor-name'].value.trim() || 'your doctor';
      setTimeout(function () { form.reset(); }, 0);
      T.closeModal('m-share');
      T.toast('Secure link sent to ' + who + '. It expires in 7 days.', 'ok', 5000);
    });
  });
})();
