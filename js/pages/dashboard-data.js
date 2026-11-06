/* Tidewell: shared mock data for the patient dashboard. Everything is seeded into localStorage on first use
   and never leaves the browser. window.TidewellData */
(function () {
  'use strict';
  var K = { bookings: 'tidewell-bookings', sessions: 'tidewell-sessions', profile: 'tidewell-profile', notify: 'tidewell-notify',
    invoices: 'tidewell-invoices', methods: 'tidewell-methods', fluid: 'tidewell-fluid', meds: 'tidewell-meds-taken', accounts: 'tidewell-accounts' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var CENTRES = [
    { key: 'besant', name: 'Tidewell Chennai (Besant Nagar)', short: 'Besant Nagar', city: 'Chennai', address: '14 Marina Crescent, Besant Nagar, Chennai 600090', phone: '+91 44 4960 2210' },
    { key: 'annanagar', name: 'Tidewell Chennai (Anna Nagar)', short: 'Anna Nagar', city: 'Chennai', address: '7 Park View Road, Anna Nagar, Chennai 600040', phone: '+91 44 4960 2290' },
    { key: 'indiranagar', name: 'Tidewell Bengaluru (Indiranagar)', short: 'Indiranagar', city: 'Bengaluru', address: '22 Lakeview Road, Indiranagar, Bengaluru 560038', phone: '+91 80 4960 3315' }
  ];
  var SHIFTS = [
    { key: 'morning', name: 'Morning', range: '06:30 to 11:00', times: ['06:30', '07:00', '07:30'] },
    { key: 'afternoon', name: 'Afternoon', range: '11:30 to 16:00', times: ['11:30', '12:00', '12:30'] },
    { key: 'evening', name: 'Evening', range: '16:30 to 21:00', times: ['16:30', '17:00', '17:30'] }
  ];
  var CHAIRS = [
    { key: 'recliner', name: 'Recliner chair', note: 'Shared bay, TV and reading light' },
    { key: 'bed', name: 'Dialysis bed', note: 'Lie flat, good for longer sessions' },
    { key: 'private', name: 'Private room', note: 'Quiet room, +₹800 per session' }
  ];
  var NURSES = ['Anita Joseph', 'Daniel Mensah', 'Thomas Mathew', 'Grace Okafor'];

  function rd(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(n, from) { var d = from ? parse(from) : new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function today() { return iso(new Date()); }
  function dow(s) { return parse(s).getDay(); }
  function fmt(s, style) {
    var d = parse(s);
    if (style === 'long') return DAYS_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()];
    if (style === 'day') return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
    if (style === 'month') return MONTHS[d.getMonth()];
    if (style === 'monthyear') return MONTHS_LONG[d.getMonth()] + ' ' + d.getFullYear();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function centre(key) { for (var i = 0; i < CENTRES.length; i++) if (CENTRES[i].key === key) return CENTRES[i]; return CENTRES[0]; }
  function chair(key) { for (var i = 0; i < CHAIRS.length; i++) if (CHAIRS[i].key === key) return CHAIRS[i]; return CHAIRS[0]; }
  function shiftOf(time) { for (var i = 0; i < SHIFTS.length; i++) if (SHIFTS[i].times.indexOf(time) > -1) return SHIFTS[i]; return SHIFTS[0]; }
  function ref() { return 'TW-' + Math.floor(10000 + Math.random() * 89999); }

  /* Mon/Wed/Fri dates going back (or forward) from a start date */
  function mwf(count, dir) {
    var out = [], d = today(), guard = 0;
    while (out.length < count && guard++ < 400) {
      d = addDays(dir, d);
      var w = dow(d);
      if (w === 1 || w === 3 || w === 5) out.push(d);
    }
    return out;
  }

  /* ---------- seeds ---------- */
  function seedSessions() {
    return mwf(30, -1).map(function (date, i) {
      var h = hash(date), pre = 70.2 + (h % 18) / 10, removed = 1.6 + (h % 13) / 10;
      var missed = i === 9, short = i === 4;
      var nurse = NURSES[h % NURSES.length];
      var notes = [
        'Comfortable session. Fistula thrill strong, no bleeding after needle removal.',
        'Mild cramp in the last 30 minutes, eased after lowering the fluid removal rate. Reminded about fluid limit.',
        'Blood pressure dipped mid-session, legs raised and settled within 10 minutes. Ate well afterwards.',
        'Good session. Discussed potassium-friendly snacks with the dietitian.',
        'Slept for most of the run. Access site clean and dry.'
      ][h % 5];
      if (missed) return { id: 's' + i, date: date, time: '07:00', centre: 'besant', chair: 'recliner', nurse: nurse, status: 'missed', notes: 'Session missed: fever reported by phone. Make-up session arranged for the next morning.' };
      return {
        id: 's' + i, date: date, time: '07:00', centre: i % 7 === 3 ? 'annanagar' : 'besant', chair: i % 6 === 2 ? 'bed' : 'recliner', nurse: nurse,
        status: short ? 'shortened' : 'completed',
        preWeight: +pre.toFixed(1), postWeight: +(pre - removed + 0.1).toFixed(1),
        bpPre: (138 + h % 14) + '/' + (82 + h % 8), bpPost: (124 + h % 10) + '/' + (76 + h % 6),
        duration: short ? 205 : 240 - (h % 3) * 5, removed: +removed.toFixed(1), ktv: +(1.28 + (h % 21) / 100).toFixed(2),
        notes: short ? 'Session stopped 35 minutes early at patient request (family event). Fluid goal mostly met.' : notes
      };
    });
  }
  function seedBookings() {
    var dates = mwf(6, 1);
    return dates.map(function (d, i) {
      return { id: 'b' + i, ref: 'TW-' + (48210 + i * 7), date: d, time: '07:00', centre: 'besant', chair: 'recliner', transport: i % 2 === 0, status: 'confirmed', series: 'MWF' };
    });
  }
  var SEED_PROFILE = {
    first: 'Michael', last: 'Grant', email: 'michael.grant@example.com', phone: '9840012345', dob: '1966-08-21', patientId: 'TW-20417', treatment: 'In-centre haemodialysis', seat: 'Bay B, chair 6',
    address: '41 Third Cross Street, Besant Nagar, Chennai 600090', bloodGroup: 'B+', since: '2023-03-06', dryWeight: '68.5', access: 'AV fistula, left forearm',
    centre: 'besant', nephrologist: 'Dr Mei Lin Chua', emName: 'Sarah Grant', emRelation: 'Spouse', emPhone: '9840098765'
  };
  var SEED_NOTIFY = { sessionSms: true, sessionEmail: true, fluid: true, meds: true, labs: true, billing: false, news: false };
  function seedInvoices() {
    return [
      { id: 'INV-24118', date: addDays(-3), desc: 'Haemodialysis, 6 sessions', total: 15600, covered: 12480, status: 'due', due: addDays(11) },
      { id: 'INV-24062', date: addDays(-17), desc: 'Monthly labs and EPO injections', total: 6850, covered: 4110, status: 'due', due: addDays(-2) },
      { id: 'INV-23987', date: addDays(-31), desc: 'Haemodialysis, 13 sessions', total: 33800, covered: 27040, status: 'paid', due: addDays(-17), paidOn: addDays(-20) },
      { id: 'INV-23841', date: addDays(-45), desc: 'Vascular access review', total: 2400, covered: 2400, status: 'covered', due: addDays(-31) },
      { id: 'INV-23790', date: addDays(-61), desc: 'Haemodialysis, 13 sessions', total: 33800, covered: 27040, status: 'paid', due: addDays(-47), paidOn: addDays(-50) },
      { id: 'INV-23655', date: addDays(-76), desc: 'Dietitian consultation', total: 1200, covered: 0, status: 'paid', due: addDays(-62), paidOn: addDays(-70) }
    ];
  }
  function seedMethods() {
    return [
      { id: 'pm1', type: 'card', brand: 'Visa', last4: '4821', exp: '09/28', primary: true },
      { id: 'pm2', type: 'upi', label: 'michael.grant@okaxis', primary: false }
    ];
  }

  var LABS = (function () {
    var out = [], hb = [10.2, 10.6, 10.9, 10.7, 11.2, 11.4], k = [5.6, 5.3, 5.1, 5.4, 4.9, 4.8], ktv = [1.31, 1.36, 1.38, 1.35, 1.42, 1.44],
      ph = [6.1, 5.8, 5.6, 5.9, 5.3, 5.1], alb = [3.6, 3.7, 3.7, 3.8, 3.9, 3.9];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(); d.setDate(2); d.setMonth(d.getMonth() - i);
      var j = 5 - i;
      out.push({ date: iso(d), hb: hb[j], k: k[j], ktv: ktv[j], phos: ph[j], alb: alb[j] });
    }
    return out;
  })();
  var METRICS = {
    hb: { label: 'Haemoglobin', unit: 'g/dL', target: 11, targetLabel: 'Target from', range: '10.0 to 12.0', ok: function (v) { return v >= 10 && v <= 12; } },
    k: { label: 'Potassium', unit: 'mmol/L', target: 5.0, targetLabel: 'Keep under', range: '3.5 to 5.0', ok: function (v) { return v >= 3.5 && v <= 5.0; } },
    ktv: { label: 'Kt/V (dialysis adequacy)', unit: '', target: 1.2, targetLabel: 'Minimum', range: '1.2 or higher', ok: function (v) { return v >= 1.2; } },
    phos: { label: 'Phosphate', unit: 'mg/dL', target: 5.5, targetLabel: 'Keep under', range: '3.5 to 5.5', ok: function (v) { return v >= 3.5 && v <= 5.5; } },
    alb: { label: 'Albumin', unit: 'g/dL', target: 3.8, targetLabel: 'Target from', range: '3.8 or higher', ok: function (v) { return v >= 3.8; } }
  };
  var PRESCRIPTIONS = [
    { name: 'Sevelamer carbonate 800 mg', dose: '1 tablet with each meal', purpose: 'Phosphate binder', by: 'Dr Mei Lin Chua', refill: 12, times: ['08:00', '13:00', '20:00'] },
    { name: 'Erythropoietin (EPO) 4000 IU', dose: 'Injection at dialysis, Mon and Fri', purpose: 'Anaemia', by: 'Dr Mei Lin Chua', refill: 0, times: [] },
    { name: 'Calcitriol 0.25 mcg', dose: '1 capsule daily', purpose: 'Bone health', by: 'Dr Mei Lin Chua', refill: 20, times: ['08:00'] },
    { name: 'Amlodipine 5 mg', dose: '1 tablet at night (skip on low-BP days)', purpose: 'Blood pressure', by: 'Dr Kavya Sharma', refill: 6, times: ['21:00'] },
    { name: 'Renal multivitamin', dose: '1 tablet after dialysis', purpose: 'Water-soluble vitamins', by: 'Elena Fernandes', refill: 25, times: ['12:00'] }
  ];
  var DOCUMENTS = [
    { name: 'Care plan 2026 (reviewed)', type: 'PDF', size: '420 KB', date: addDays(-24), kind: 'care' },
    { name: 'Dialysis prescription', type: 'PDF', size: '180 KB', date: addDays(-24), kind: 'care' },
    { name: 'Renal diet plan, low potassium', type: 'PDF', size: '610 KB', date: addDays(-52), kind: 'care' },
    { name: 'Vascular access ultrasound report', type: 'PDF', size: '1.2 MB', date: addDays(-45), kind: 'report' },
    { name: 'Hepatitis B vaccination record', type: 'PDF', size: '95 KB', date: addDays(-140), kind: 'report' },
    { name: 'Travel dialysis letter', type: 'PDF', size: '110 KB', date: addDays(-90), kind: 'letter' }
  ];
  var CARE_TEAM = [
    { name: 'Dr Mei Lin Chua', role: 'Your nephrologist', phone: '+91 44 4960 2210', when: 'Clinic Tue and Thu, on call 24/7', initials: 'MC' },
    { name: 'Anita Joseph', role: 'Primary nurse, Besant Nagar', phone: '+91 44 4960 2210', when: 'On the unit, Mon to Sat', initials: 'AJ' },
    { name: 'Elena Fernandes', role: 'Renal dietitian', phone: '+91 44 4960 2210', when: 'Diet clinic, Wednesdays', initials: 'EF' }
  ];
  var FLUID_LIMIT = 1000; // ml per day

  /* ---------- accessors ---------- */
  function list(key, seed) { var v = rd(key); if (!Array.isArray(v)) { v = seed(); wr(key, v); } return v; }
  function obj(key, seed) { var v = rd(key); if (!v || typeof v !== 'object') { v = JSON.parse(JSON.stringify(seed)); wr(key, v); } return v; }
  function sessions() { return list(K.sessions, seedSessions); }
  function bookings() { return list(K.bookings, seedBookings); }
  function saveBookings(b) { wr(K.bookings, b); }
  function profile() {
    var p = obj(K.profile, SEED_PROFILE), demo = p.email === SEED_PROFILE.email, ch = false;
    Object.keys(SEED_PROFILE).forEach(function (k) { if (p[k] === undefined) { p[k] = demo || k === 'centre' || k === 'treatment' ? SEED_PROFILE[k] : ''; ch = true; } });
    if (!p.passwordChanged) { p.passwordChanged = addDays(-74); ch = true; }
    if (ch) wr(K.profile, p);
    return p;
  }
  function saveProfile(p) { wr(K.profile, p); }
  function notify() { return obj(K.notify, SEED_NOTIFY); }
  function saveNotify(n) { wr(K.notify, n); }
  function invoices() { return list(K.invoices, seedInvoices); }
  function saveInvoices(v) { wr(K.invoices, v); }
  function methods() { return list(K.methods, seedMethods); }
  function saveMethods(v) { wr(K.methods, v); }
  function fluid() { var f = rd(K.fluid); if (!f || f.date !== today()) { f = { date: today(), ml: 450 }; wr(K.fluid, f); } return f; }
  function saveFluid(f) { wr(K.fluid, f); }
  function medsTaken() { var m = rd(K.meds); if (!m || m.date !== today()) { m = { date: today(), taken: [] }; wr(K.meds, m); } return m; }
  function saveMedsTaken(m) { wr(K.meds, m); }
  function reset() { Object.keys(K).forEach(function (k) { if (k !== 'accounts') try { localStorage.removeItem(K[k]); } catch (e) { /* noop */ } }); }

  function isUpcoming(b) { return b.status === 'confirmed' && b.date >= today(); }
  function sortAsc(a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; }
  function upcoming() { return bookings().filter(isUpcoming).sort(sortAsc); }
  function findBooking(id) { var l = bookings(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function updateBooking(id, patch) { var l = bookings(); l.forEach(function (b) { if (b.id === id) for (var k in patch) b[k] = patch[k]; }); saveBookings(l); }
  function addBooking(b) { var l = bookings(); b.id = b.id || 'b' + Date.now() + Math.floor(Math.random() * 1000); b.ref = b.ref || ref(); l.push(b); saveBookings(l); return b; }
  function findSession(id) { var l = sessions(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function outstanding() { return invoices().filter(function (v) { return v.status === 'due' || v.status === 'overdue'; }).reduce(function (s, v) { return s + (v.total - v.covered); }, 0); }
  function invStatus(v) { if (v.status === 'due' && v.due < today()) return 'overdue'; return v.status; }

  var STATUS = {
    confirmed: ['status--ok', 'Confirmed'], completed: ['status--ok', 'Completed'], cancelled: ['status--bad', 'Cancelled'], missed: ['status--bad', 'Missed'],
    shortened: ['status--warn', 'Shortened'], paid: ['status--ok', 'Paid'], due: ['status--warn', 'Due'], overdue: ['status--bad', 'Overdue'],
    covered: ['status--info', 'Fully covered'], processing: ['status--info', 'Processing']
  };
  function statusHtml(s) { var m = STATUS[s] || ['status--info', s]; return '<span class="status ' + m[0] + '">' + m[1] + '</span>'; }

  /* ---------- availability (deterministic demo) ---------- */
  function slots(date, centreKey, ignoreId) {
    var closed = dow(date) === 0;
    var mine = bookings().filter(function (b) { return b.status === 'confirmed' && b.date === date && b.id !== ignoreId; }).map(function (b) { return b.time; });
    return SHIFTS.map(function (s) {
      return { shift: s, times: s.times.map(function (t) {
        var h = hash(date + centreKey + t);
        return { time: t, taken: closed || mine.indexOf(t) > -1 || h % 4 === 0, chairsLeft: closed ? 0 : 1 + h % 5 };
      }) };
    });
  }
  function freeCount(date, centreKey, ignoreId) {
    if (dow(date) === 0) return 0;
    return slots(date, centreKey, ignoreId).reduce(function (n, s) { return n + s.times.filter(function (t) { return !t.taken; }).length; }, 0);
  }
  function hasBookingOn(date, ignoreId) { return bookings().some(function (b) { return b.status === 'confirmed' && b.date === date && b.id !== ignoreId; }); }

  /* ---------- CSV + file helpers ---------- */
  function download(name, text, type) {
    try {
      var blob = new Blob([text], { type: type || 'text/plain' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    } catch (e) { return false; }
  }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n'); }

  function endTime(t) { var h = parseInt(t.slice(0, 2), 10) + 4, m = t.slice(3, 5); return pad(h) + ':' + m; }
  function downloadIcs(b) {
    var c = centre(b.centre), d = b.date.replace(/-/g, ''), t = b.time.replace(':', '') + '00', e = endTime(b.time).replace(':', '') + '00';
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tidewell//Dialysis session//EN', 'BEGIN:VEVENT', 'UID:' + b.ref + '@tidewell.example',
      'DTSTAMP:' + d + 'T' + t, 'DTSTART:' + d + 'T' + t, 'DTEND:' + d + 'T' + e, 'SUMMARY:Dialysis session at ' + c.name,
      'LOCATION:' + c.address, 'DESCRIPTION:Reference ' + b.ref + '. Arrive 15 minutes early for your weigh-in.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    download('tidewell-session-' + b.ref + '.ics', ics, 'text/calendar');
    if (window.Tidewell) window.Tidewell.toast('Calendar file for ' + fmt(b.date, 'day') + ' downloaded', 'ok');
  }

  /* side drawer: open/close with scrim, Esc and focus return */
  function drawer(id) {
    var el = document.getElementById(id), scrim = el && el.previousElementSibling && el.previousElementSibling.classList.contains('drawer-scrim') ? el.previousElementSibling : null, opener = null;
    function close() { if (el.hidden) return; el.hidden = true; if (scrim) scrim.hidden = true; document.body.classList.remove('modal-open'); if (opener && opener.focus) opener.focus(); }
    function open(from) { opener = from || document.activeElement; el.hidden = false; if (scrim) scrim.hidden = false; document.body.classList.add('modal-open'); el.focus(); }
    if (scrim) scrim.addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target.closest('[data-drawer-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.hidden) close(); });
    return { open: open, close: close, el: el };
  }

  /* paint name + avatar alt in the app header from the stored profile */
  function paintShell() {
    var p = profile();
    document.querySelectorAll('.avatar-name').forEach(function (n) { n.textContent = p.first; });
    document.querySelectorAll('.avatar-btn img').forEach(function (i) { i.alt = p.first + ' ' + p.last; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintShell); else paintShell();

  window.TidewellData = {
    KEYS: K, CENTRES: CENTRES, SHIFTS: SHIFTS, CHAIRS: CHAIRS, LABS: LABS, METRICS: METRICS, PRESCRIPTIONS: PRESCRIPTIONS, DOCUMENTS: DOCUMENTS,
    CARE_TEAM: CARE_TEAM, FLUID_LIMIT: FLUID_LIMIT, DAYS: DAYS, MONTHS: MONTHS,
    esc: esc, iso: iso, parse: parse, addDays: addDays, today: today, dow: dow, fmt: fmt, inr: inr, hash: hash, ref: ref,
    centre: centre, chair: chair, shiftOf: shiftOf,
    sessions: sessions, findSession: findSession, bookings: bookings, saveBookings: saveBookings, upcoming: upcoming, findBooking: findBooking,
    updateBooking: updateBooking, addBooking: addBooking, profile: profile, saveProfile: saveProfile, notify: notify, saveNotify: saveNotify,
    invoices: invoices, saveInvoices: saveInvoices, invStatus: invStatus, outstanding: outstanding, methods: methods, saveMethods: saveMethods,
    fluid: fluid, saveFluid: saveFluid, medsTaken: medsTaken, saveMedsTaken: saveMedsTaken, reset: reset,
    downloadIcs: downloadIcs, drawer: drawer, endTime: endTime,
    statusHtml: statusHtml, slots: slots, freeCount: freeCount, hasBookingOn: hasBookingOn, download: download, csv: csv, read: rd, write: wr
  };
})();
