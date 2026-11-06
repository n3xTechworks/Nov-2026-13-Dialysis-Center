/* dashboard-schedule: centre, weekly day pills, shift slots, chair, transport, recurring, confirm modal, upcoming list with reschedule/cancel */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var E = D.esc, prof = D.profile();
    var st = { centre: prof.centre || 'besant', week: 0, date: null, time: null, chair: 'recliner', transport: false, repeat: false, pattern: [1, 3, 5], weeks: 4 };
    var MAX_WEEK = 4;
    var $ = function (id) { return document.getElementById(id); };

    function monday(offsetWeeks) { var t = D.today(), w = D.dow(t); return D.addDays(-(w === 0 ? 6 : w - 1) + offsetWeeks * 7, t); }
    function weekLabel(off) { var m = monday(off), s = D.addDays(6, m); return (off === 0 ? 'This week, ' : off === 1 ? 'Next week, ' : '') + D.parse(m).getDate() + ' ' + D.fmt(m, 'month') + ' to ' + D.parse(s).getDate() + ' ' + D.fmt(s, 'month'); }

    /* ---------- centre ---------- */
    $('centreGrid').innerHTML = D.CENTRES.map(function (c) {
      return '<label class="option-card centre-card"><input type="radio" name="centre" value="' + c.key + '"' + (c.key === st.centre ? ' checked' : '') + '>' +
        '<span class="oc-body"><strong>' + E(c.name) + '</strong><span>' + E(c.address) + '</span></span></label>';
    }).join('');
    $('centreGrid').addEventListener('change', function (e) {
      st.centre = e.target.value; st.time = null; renderDays(); renderSlots(); renderSummary();
      T.toast('Showing availability at ' + D.centre(st.centre).name, 'info');
    });

    /* ---------- day pills ---------- */
    function dayPills(off, selected, ignoreId) {
      var m = monday(off), html = '';
      for (var i = 0; i < 7; i++) {
        var d = D.addDays(i, m), past = d <= D.today(), sun = D.dow(d) === 0, free = past || sun ? 0 : D.freeCount(d, st.centre, ignoreId), mine = D.hasBookingOn(d, ignoreId);
        var note = past ? 'Past' : sun ? 'Closed' : free ? free + ' free' : 'Full';
        var dis = past || sun || !free;
        html += '<button class="day-pill' + (mine ? ' has-mine' : '') + '" type="button" data-date="' + d + '" aria-pressed="' + (d === selected) + '"' + (dis ? ' disabled' : '') +
          ' aria-label="' + D.fmt(d, 'long') + ', ' + note + (mine ? ', you have a session' : '') + '"><small>' + D.DAYS[D.dow(d)] + '</small><strong>' + D.parse(d).getDate() + '</strong><small>' + note + '</small></button>';
      }
      return html;
    }
    function renderDays() {
      $('dayPills').innerHTML = dayPills(st.week, st.date);
      $('wkLabel').textContent = weekLabel(st.week);
      $('wkPrev').disabled = st.week <= 0; $('wkNext').disabled = st.week >= MAX_WEEK;
    }
    $('dayPills').addEventListener('click', function (e) {
      var b = e.target.closest('[data-date]'); if (!b || b.disabled) return;
      st.date = b.getAttribute('data-date'); st.time = null; renderDays(); renderSlots(); renderSummary();
    });
    $('wkPrev').addEventListener('click', function () { if (st.week > 0) { st.week--; renderDays(); } });
    $('wkNext').addEventListener('click', function () { if (st.week < MAX_WEEK) { st.week++; renderDays(); } });

    /* ---------- slots ---------- */
    function slotHtml(date, centreKey, selected, ignoreId) {
      return D.slots(date, centreKey, ignoreId).map(function (g) {
        return '<div class="shift"><div class="shift-head"><strong>' + g.shift.name + '</strong><span>' + g.shift.range + '</span></div><div class="slot-grid">' +
          g.times.map(function (t) {
            return '<button class="slot' + (t.taken ? ' is-taken' : '') + '" type="button" data-time="' + t.time + '" aria-pressed="' + (t.time === selected) + '"' + (t.taken ? ' aria-disabled="true"' : '') +
              ' aria-label="' + t.time + (t.taken ? ', fully booked' : ', ' + t.chairsLeft + ' chairs left') + '"><span>' + t.time + '</span><small>' + (t.taken ? 'Full' : t.chairsLeft + ' left') + '</small></button>';
          }).join('') + '</div></div>';
      }).join('');
    }
    function renderSlots() {
      $('shiftBox').innerHTML = st.date ? '<p class="shift-day">' + D.fmt(st.date, 'long') + ' at ' + E(D.centre(st.centre).name) + '</p>' + slotHtml(st.date, st.centre, st.time)
        : '<div class="empty empty--slim"><p>Choose a day above to see morning, afternoon and evening times.</p></div>';
    }
    $('shiftBox').addEventListener('click', function (e) {
      var b = e.target.closest('[data-time]'); if (!b) return;
      if (b.classList.contains('is-taken')) { T.toast(b.getAttribute('data-time') + ' is fully booked. Try another time or day.', 'info'); return; }
      st.time = b.getAttribute('data-time'); renderSlots(); renderSummary();
    });

    /* ---------- chair + extras ---------- */
    $('chairGrid').innerHTML = D.CHAIRS.map(function (c) {
      return '<label class="option-card chair-card"><input type="radio" name="chair" value="' + c.key + '"' + (c.key === st.chair ? ' checked' : '') + '><span class="oc-body"><strong>' + E(c.name) + '</strong><span>' + E(c.note) + '</span></span></label>';
    }).join('');
    $('chairGrid').addEventListener('change', function (e) { st.chair = e.target.value; renderSummary(); });
    $('optTransport').addEventListener('change', function () { st.transport = this.checked; $('pickupField').hidden = !this.checked; if (this.checked && !$('pickupAddr').value) $('pickupAddr').value = prof.address || ''; renderSummary(); });
    $('optRepeat').addEventListener('change', function () { st.repeat = this.checked; $('repeatBox').hidden = !this.checked; renderSummary(); });
    $('patternChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-pattern]'); if (!c) return;
      this.querySelectorAll('[data-pattern]').forEach(function (x) { var on = x === c; x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-checked', String(on)); });
      st.pattern = c.getAttribute('data-pattern').split(',').map(Number); renderSummary();
    });
    $('repeatWeeks').addEventListener('change', function () { st.weeks = +this.value; renderSummary(); });

    /* ---------- summary ---------- */
    function seriesDates() {
      if (!st.date) return [];
      if (!st.repeat) return [st.date];
      var out = [], end = D.addDays(st.weeks * 7, st.date);
      for (var d = st.date; d < end; d = D.addDays(1, d)) if (d === st.date || st.pattern.indexOf(D.dow(d)) > -1) out.push(d);
      return out;
    }
    function rows() {
      var c = D.centre(st.centre), ch = D.chair(st.chair), n = seriesDates().length;
      return [['Centre', c.name], ['Day', st.date ? D.fmt(st.date, 'long') : 'Not chosen'], ['Time', st.time ? st.time + ' to ' + D.endTime(st.time) + ' (' + D.shiftOf(st.time).name.toLowerCase() + ')' : 'Not chosen'],
        ['Chair', ch.name], ['Transport', st.transport ? 'Pickup requested' : 'Not needed'], ['Repeats', st.repeat ? (st.pattern[0] === 1 ? 'Mon / Wed / Fri' : 'Tue / Thu / Sat') + ', ' + st.weeks + ' weeks' : 'One session'],
        ['Sessions', st.date ? String(n) : '0']];
    }
    function dl(r) { return r.map(function (x) { return '<div><dt>' + E(x[0]) + '</dt><dd>' + E(x[1]) + '</dd></div>'; }).join(''); }
    function renderSummary() { $('sumList').innerHTML = dl(rows()); $('bookError').textContent = ''; }

    $('reviewBtn').addEventListener('click', function () {
      var err = !st.date ? 'Choose a day for your session.' : !st.time ? 'Choose a time for your session.' : D.hasBookingOn(st.date) ? 'You already have a session on ' + D.fmt(st.date, 'day') + '. Reschedule it below instead.' :
        (st.transport && $('pickupAddr').value.trim().length < 6) ? 'Add a pickup address for transport.' : '';
      if (err) { $('bookError').textContent = err; T.toast(err, 'error'); return; }
      var dates = seriesDates(), clash = dates.filter(function (d) { return D.hasBookingOn(d); });
      $('cfList').innerHTML = dl(rows());
      $('cfLead').textContent = dates.length > 1 ? 'You are booking ' + (dates.length - clash.length) + ' sessions. Days where you already have a session are skipped.' : 'Please check the details below.';
      $('cfDates').innerHTML = dates.length > 1 ? dates.map(function (d) { var c = clash.indexOf(d) > -1; return '<li class="' + (c ? 'is-skip' : '') + '">' + D.fmt(d, 'day') + (c ? ' (skipped)' : '') + '</li>'; }).join('') : '';
      T.openModal('m-confirm', this);
    });
    $('cfBtn').addEventListener('click', function () {
      var series = st.repeat ? 'S' + Date.now() : '', made = [];
      seriesDates().forEach(function (d) {
        if (D.hasBookingOn(d)) return;
        made.push(D.addBooking({ date: d, time: st.time, centre: st.centre, chair: st.chair, transport: st.transport, pickup: st.transport ? $('pickupAddr').value.trim() : '', status: 'confirmed', series: series }));
      });
      T.closeModal('m-confirm');
      T.toast(made.length > 1 ? made.length + ' sessions booked from ' + D.fmt(made[0].date, 'day') + ' at ' + st.time + '.' : 'Session booked for ' + D.fmt(made[0].date, 'long') + ' at ' + st.time + '. Ref ' + made[0].ref + '.', 'ok', 5000);
      reset(); renderUpcoming(made.map(function (m) { return m.id; }));
      $('upcoming').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    function reset() {
      st.date = null; st.time = null; st.week = 0; st.transport = false; st.repeat = false;
      $('optTransport').checked = false; $('optRepeat').checked = false; $('pickupField').hidden = true; $('repeatBox').hidden = true;
      renderDays(); renderSlots(); renderSummary();
    }
    $('clearBtn').addEventListener('click', function () { reset(); T.toast('Booking form cleared', 'info'); });

    /* ---------- upcoming ---------- */
    var showAll = false;
    function renderUpcoming(flash) {
      var up = D.upcoming(), list = showAll ? up : up.slice(0, 6);
      $('upCount').textContent = up.length;
      $('upCal').disabled = !up.length;
      $('upList').innerHTML = !up.length ? '<div class="empty"><h3>No upcoming sessions</h3><p>Use the form above to book your next session.</p></div>' :
        list.map(function (b) {
          var d = D.parse(b.date), c = D.centre(b.centre);
          return '<article class="up-item' + (flash && flash.indexOf(b.id) > -1 ? ' is-flash' : '') + '" id="bk-' + b.id + '"><div class="up-date"><small>' + D.DAYS[d.getDay()] + '</small><strong>' + d.getDate() + '</strong><small>' + D.MONTHS[d.getMonth()] + '</small></div>' +
            '<div class="up-body"><h3>' + E(b.time) + ' to ' + D.endTime(b.time) + ' · ' + E(c.short || c.name) + '</h3><p>' + E(D.chair(b.chair).name) + ' · Ref ' + E(b.ref) + '</p><div class="up-badges">' +
            (b.transport ? '<span class="badge badge--ok">Pickup booked</span>' : '') + (b.series ? '<span class="badge badge--sand">Recurring</span>' : '') + '</div></div>' +
            '<div class="up-acts"><button class="btn btn-secondary btn-sm" type="button" data-act="cal" data-id="' + b.id + '">Calendar</button><button class="btn btn-secondary btn-sm" type="button" data-act="resched" data-id="' + b.id + '">Reschedule</button><button class="btn btn-secondary btn-sm btn-quiet-danger" type="button" data-act="cancel" data-id="' + b.id + '">Cancel</button></div></article>';
        }).join('') + (up.length > 6 ? '<div class="up-more"><button class="btn btn-secondary" type="button" id="upMore">' + (showAll ? 'Show fewer' : 'Show all ' + up.length + ' sessions') + '</button></div>' : '');
      var more = $('upMore'); if (more) more.addEventListener('click', function () { showAll = !showAll; renderUpcoming(); });
    }
    $('upCal').addEventListener('click', function () {
      var up = D.upcoming(); if (!up.length) return;
      var ev = up.map(function (b) { var c = D.centre(b.centre), d = b.date.replace(/-/g, ''); return ['BEGIN:VEVENT', 'UID:' + b.ref + '@tidewell.example', 'DTSTAMP:' + d + 'T000000', 'DTSTART:' + d + 'T' + b.time.replace(':', '') + '00', 'DTEND:' + d + 'T' + D.endTime(b.time).replace(':', '') + '00', 'SUMMARY:Dialysis at ' + c.name, 'LOCATION:' + c.address, 'END:VEVENT'].join('\r\n'); });
      D.download('tidewell-sessions.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tidewell//Sessions//EN'].concat(ev, ['END:VCALENDAR']).join('\r\n'), 'text/calendar');
      T.toast(up.length + ' sessions added to a calendar file', 'ok');
    });

    /* ---------- reschedule ---------- */
    var cur = null, rs = { week: 0, date: null, time: null };
    function renderRs() {
      $('rsDays').innerHTML = dayPills(rs.week, rs.date, cur && cur.id);
      $('rsWk').textContent = weekLabel(rs.week);
      $('rsPrev').disabled = rs.week <= 0; $('rsNext').disabled = rs.week >= MAX_WEEK;
      $('rsTimes').innerHTML = rs.date ? slotHtml(rs.date, cur.centre, rs.time, cur.id) : '<p class="field-hint">Choose a day to see available times.</p>';
      $('rsConfirm').disabled = !(rs.date && rs.time);
      $('rsConfirm').textContent = rs.date && rs.time ? 'Move to ' + D.fmt(rs.date, 'day') + ', ' + rs.time : 'Pick a day and time';
    }
    function openResched(id, opener) {
      cur = D.findBooking(id); if (!cur) return;
      rs = { week: 0, date: null, time: null };
      $('rsCurrent').textContent = 'Currently ' + D.fmt(cur.date, 'long') + ' at ' + cur.time + ', ' + D.centre(cur.centre).name + '.';
      renderRs(); T.openModal('m-resched', opener);
    }
    $('rsDays').addEventListener('click', function (e) { var b = e.target.closest('[data-date]'); if (!b || b.disabled) return; rs.date = b.getAttribute('data-date'); rs.time = null; renderRs(); });
    $('rsTimes').addEventListener('click', function (e) {
      var b = e.target.closest('[data-time]'); if (!b) return;
      if (b.classList.contains('is-taken')) { T.toast(b.getAttribute('data-time') + ' is fully booked', 'info'); return; }
      rs.time = b.getAttribute('data-time'); renderRs();
    });
    $('rsPrev').addEventListener('click', function () { if (rs.week > 0) { rs.week--; renderRs(); } });
    $('rsNext').addEventListener('click', function () { if (rs.week < MAX_WEEK) { rs.week++; renderRs(); } });
    $('rsConfirm').addEventListener('click', function () {
      if (!cur || !rs.date || !rs.time) return;
      if (D.hasBookingOn(rs.date, cur.id)) { T.toast('You already have a session on ' + D.fmt(rs.date, 'day') + '. Pick another day.', 'error'); return; }
      D.updateBooking(cur.id, { date: rs.date, time: rs.time });
      T.closeModal('m-resched');
      T.toast('Session moved to ' + D.fmt(rs.date, 'long') + ' at ' + rs.time, 'ok');
      renderUpcoming([cur.id]); renderDays();
    });

    /* ---------- cancel ---------- */
    function openCancel(id, opener) {
      cur = D.findBooking(id); if (!cur) return;
      $('m-cancel-title').textContent = 'Cancel ' + D.fmt(cur.date, 'day') + ' at ' + cur.time + '?';
      $('cnReason').value = ''; $('cnError').textContent = '';
      T.openModal('m-cancel', opener);
    }
    $('cnConfirm').addEventListener('click', function () {
      if (!$('cnReason').value) { $('cnError').textContent = 'Choose a reason so your nurse can follow up.'; $('cnReason').setAttribute('aria-invalid', 'true'); $('cnReason').focus(); return; }
      $('cnReason').setAttribute('aria-invalid', 'false');
      D.updateBooking(cur.id, { status: 'cancelled', reason: $('cnReason').value });
      T.closeModal('m-cancel');
      T.toast('Session on ' + D.fmt(cur.date, 'day') + ' cancelled. Your nurse has been told.', 'info');
      renderUpcoming(); renderDays();
    });
    $('cnReason').addEventListener('change', function () { $('cnError').textContent = ''; this.setAttribute('aria-invalid', 'false'); });

    $('upList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
      if (act === 'resched') openResched(id, b);
      else if (act === 'cancel') openCancel(id, b);
      else if (act === 'cal') { var bk = D.findBooking(id); if (bk) D.downloadIcs(bk); }
    });

    renderDays(); renderSlots(); renderSummary(); renderUpcoming();
    var q = new URLSearchParams(location.search).get('reschedule');
    if (q && D.findBooking(q)) openResched(q);
  });
})();
