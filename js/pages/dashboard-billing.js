/* dashboard-billing: balance, cover, invoices (filter, pay, receipt), payment methods, pay-now modal with validated card form (mock) */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var D = window.TidewellData, T = window.Tidewell;
    if (!D || !T) return;
    var E = D.esc, $ = function (id) { return document.getElementById(id); }, filter = 'all', paying = [], mode = 'pay';
    function open(v) { var s = D.invStatus(v); return s === 'due' || s === 'overdue'; }
    function you(v) { return v.total - v.covered; }

    /* balance */
    function renderBalance() {
      var list = D.invoices().filter(open), amt = list.reduce(function (s, v) { return s + you(v); }, 0);
      var over = list.filter(function (v) { return D.invStatus(v) === 'overdue'; });
      $('balAmt').textContent = D.inr(amt);
      $('balStatus').innerHTML = !list.length ? D.statusHtml('paid') : over.length ? D.statusHtml('overdue') : D.statusHtml('due');
      $('balSub').textContent = !list.length ? 'You are all paid up. Thank you.' : list.length + ' invoice' + (list.length > 1 ? 's' : '') + ' to pay' +
        (over.length ? ', ' + over.length + ' past its due date' : ', next due ' + D.fmt(list.map(function (v) { return v.due; }).sort()[0], 'day')) + '. After insurance and scheme cover.';
      $('payAllBtn').disabled = !list.length;
      var paid = D.invoices().filter(function (v) { return v.paidOn; }).sort(function (a, b) { return a.paidOn < b.paidOn ? 1 : -1; })[0], pm = D.methods().filter(function (m) { return m.primary; })[0];
      $('balFoot').innerHTML = (paid ? '<div><dt>Last payment</dt><dd>' + D.inr(you(paid)) + ' on ' + D.fmt(paid.paidOn) + '</dd></div>' : '') +
        '<div><dt>Default method</dt><dd>' + (pm ? E(label(pm)) : 'None saved') + '</dd></div><div><dt>Payment terms</dt><dd>14 days from invoice</dd></div>';
    }

    /* cover */
    var COVER = [
      { name: 'CareShield Health Insurance', ref: 'Policy CSH-88-204517', share: 'Covers 80% of dialysis sessions', used: 312400, limit: 500000, renew: 'Renews 1 April 2027' },
      { name: 'Ayushman Bharat PM-JAY', ref: 'Card ending 4471', share: 'Covers vascular access procedures and labs', used: 18600, limit: 500000, renew: 'Family cover, valid this year' }
    ];
    $('coverList').innerHTML = COVER.map(function (c) {
      var pct = Math.round(c.used / c.limit * 100);
      return '<div class="cover"><div class="cover-top"><strong>' + E(c.name) + '</strong><span>' + E(c.ref) + '</span></div><p>' + E(c.share) + '</p>' +
        '<div class="meter" role="progressbar" aria-label="' + E(c.name) + ' used this year" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="--v:' + pct + '%"></span></div>' +
        '<p>' + D.inr(c.used) + ' of ' + D.inr(c.limit) + ' used this year · ' + E(c.renew) + '</p></div>';
    }).join('') + '<button class="btn btn-secondary btn-sm cover-btn" type="button" id="coverBtn">Ask us to re-check my cover</button>';
    $('coverBtn').addEventListener('click', function () { this.disabled = true; this.textContent = 'Check requested'; T.toast('Mai Nguyen will re-check your cover and update you within two working days.', 'ok'); });

    /* invoices */
    function renderInvoices() {
      var list = D.invoices().filter(function (v) { return filter === 'all' || (filter === 'open' ? open(v) : !open(v)); });
      $('invRows').innerHTML = list.map(function (v) {
        var st = D.invStatus(v);
        return '<tr><td class="cell-strong">' + E(v.id) + '</td><td class="num">' + D.fmt(v.date) + '</td><td>' + E(v.desc) + '</td><td class="num">' + D.inr(v.total) + '</td><td class="num">' + D.inr(v.covered) + '</td>' +
          '<td class="num cell-strong">' + D.inr(you(v)) + '</td><td>' + D.statusHtml(st) + (st === 'due' || st === 'overdue' ? '<br><small class="field-hint">Due ' + D.fmt(v.due, 'day') + '</small>' : '') + '</td>' +
          '<td><div class="cell-actions">' + (open(v) ? '<button class="btn btn-primary btn-sm" type="button" data-pay="' + v.id + '">Pay</button>' : '<button class="btn btn-secondary btn-sm" type="button" data-receipt="' + v.id + '">Receipt</button>') + '</div></td></tr>';
      }).join('') || '<tr><td colspan="8"><div class="empty empty--slim"><p>No invoices here.</p></div></td></tr>';
    }
    $('invChips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-f]'); if (!c) return;
      this.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      filter = c.getAttribute('data-f'); renderInvoices();
    });
    $('invRows').addEventListener('click', function (e) {
      var p = e.target.closest('[data-pay]'), r = e.target.closest('[data-receipt]');
      if (p) openPay([p.getAttribute('data-pay')], p);
      if (r) receipt(r.getAttribute('data-receipt'));
    });
    function receipt(id) {
      var v = D.invoices().filter(function (x) { return x.id === id; })[0]; if (!v) return;
      var pr = D.profile();
      D.download('tidewell-receipt-' + v.id + '.txt', ['Tidewell Dialysis Centre: receipt', 'Invoice: ' + v.id, 'Patient: ' + pr.first + ' ' + pr.last + ' (' + pr.patientId + ')', 'Description: ' + v.desc,
        'Total: ' + D.inr(v.total), 'Covered by insurance/scheme: ' + D.inr(v.covered), 'Paid by you: ' + D.inr(you(v)), 'Status: ' + D.invStatus(v) + (v.paidOn ? ' on ' + D.fmt(v.paidOn) : '')].join('\n'), 'text/plain');
      T.toast('Receipt for ' + v.id + ' downloaded', 'ok');
    }

    /* payment methods */
    function label(m) { return m.type === 'card' ? m.brand + ' ending ' + m.last4 : 'UPI ' + m.label; }
    function renderMethods() {
      var ms = D.methods();
      $('pmList').innerHTML = ms.map(function (m) {
        return '<div class="pm' + (m.primary ? ' is-primary' : '') + '"><div class="pm-top"><span class="pm-logo' + (m.type === 'upi' ? ' pm-logo--upi' : '') + '" aria-hidden="true">' + (m.type === 'card' ? E(m.brand.toUpperCase()) : 'UPI') + '</span>' +
          '<div><strong>' + E(m.type === 'card' ? m.brand + ' •••• ' + m.last4 : m.label) + '</strong><span>' + (m.type === 'card' ? 'Expires ' + E(m.exp) : 'Linked UPI ID') + '</span></div>' + (m.primary ? '<span class="pm-default">Default</span>' : '') + '</div>' +
          '<div class="pm-acts">' + (m.primary ? '' : '<button class="btn btn-secondary btn-sm" type="button" data-default="' + m.id + '">Make default</button>') + '<button class="btn btn-secondary btn-sm btn-quiet-danger" type="button" data-remove="' + m.id + '">Remove</button></div></div>';
      }).join('') || '<div class="empty empty--slim"><p>No saved payment methods. Add a card to pay faster.</p></div>';
    }
    $('pmList').addEventListener('click', function (e) {
      var d = e.target.closest('[data-default]'), r = e.target.closest('[data-remove]'), ms = D.methods();
      if (d) { ms.forEach(function (m) { m.primary = m.id === d.getAttribute('data-default'); }); D.saveMethods(ms); renderMethods(); renderBalance(); T.toast(label(ms.filter(function (m) { return m.primary; })[0]) + ' is now your default', 'ok'); }
      if (r) {
        rmId = r.getAttribute('data-remove');
        var m = ms.filter(function (x) { return x.id === rmId; })[0];
        $('m-remove-title').textContent = 'Remove ' + label(m) + '?';
        $('rmText').textContent = (m.primary ? 'This is your default method. ' : '') + 'You can add it again at any time.';
        T.openModal('m-remove', r);
      }
    });

    var rmId = null;
    $('rmConfirm').addEventListener('click', function () {
      var ms = D.methods(), gone = ms.filter(function (m) { return m.id === rmId; })[0]; if (!gone) return;
      ms = ms.filter(function (m) { return m !== gone; }); if (gone.primary && ms[0]) ms[0].primary = true;
      D.saveMethods(ms); T.closeModal('m-remove'); renderMethods(); renderBalance(); T.toast(label(gone) + ' removed', 'info');
    });

    /* pay modal */
    var form = $('payForm'), cardFields = $('cardFields');
    function setNew(on) { cardFields.hidden = !on; cardFields.querySelectorAll('input').forEach(function (i) { i.disabled = !on; }); }
    function openPay(ids, opener) {
      mode = ids ? 'pay' : 'add';
      paying = ids || [];
      var inv = D.invoices().filter(function (v) { return paying.indexOf(v.id) > -1; }), total = inv.reduce(function (s, v) { return s + you(v); }, 0);
      $('m-pay-title').textContent = mode === 'pay' ? 'Pay ' + D.inr(total) : 'Add a card';
      $('payLead').textContent = mode === 'pay' ? 'Secure demo payment. No money will move.' : 'Save a card for faster payments. We store only the last four digits.';
      $('paySum').hidden = mode !== 'pay';
      $('paySum').innerHTML = inv.map(function (v) { return '<div><dt>' + E(v.id + ' · ' + v.desc) + '</dt><dd>' + D.inr(you(v)) + '</dd></div>'; }).join('') + '<div><dt><strong>Total</strong></dt><dd>' + D.inr(total) + '</dd></div>';
      var ms = mode === 'pay' ? D.methods() : [];
      $('payMethods').hidden = !ms.length;
      $('payMethods').innerHTML = ms.map(function (m) { return '<label class="pay-opt"><input type="radio" name="method" value="' + m.id + '"' + (m.primary ? ' checked' : '') + '>' + E(label(m)) + '</label>'; }).join('') +
        (ms.length ? '<label class="pay-opt"><input type="radio" name="method" value="new">A new card</label>' : '');
      setNew(!ms.length);
      $('paySave').checked = mode === 'add'; $('paySave').closest('.field').hidden = mode === 'add';
      ['pay-name', 'pay-num', 'pay-exp', 'pay-cvv'].forEach(function (id) { $(id).value = ''; $(id).setAttribute('aria-invalid', 'false'); var er = $(id + '-error'); if (er) er.textContent = ''; });
      $('paySubmit').textContent = mode === 'pay' ? 'Pay ' + D.inr(total) : 'Save card';
      T.openModal('m-pay', opener);
    }
    $('payMethods').addEventListener('change', function (e) { setNew(e.target.value === 'new'); if (e.target.value === 'new') $('pay-name').focus(); });
    $('payAllBtn').addEventListener('click', function () { openPay(D.invoices().filter(open).map(function (v) { return v.id; }), this); });
    $('addMethodBtn').addEventListener('click', function () { openPay(null, this); });

    /* card input helpers */
    $('pay-num').addEventListener('input', function () { var d = this.value.replace(/\D/g, '').slice(0, 16); this.value = d.replace(/(.{4})/g, '$1 ').trim(); });
    $('pay-exp').addEventListener('input', function (e) { var d = this.value.replace(/\D/g, '').slice(0, 4); this.value = d.length > 2 || (d.length === 2 && e.inputType !== 'deleteContentBackward') ? d.slice(0, 2) + '/' + d.slice(2) : d; });
    $('pay-cvv').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    function luhn(n) { var s = 0, alt = false; for (var i = n.length - 1; i >= 0; i--) { var d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; }
    function cardErrors() {
      var errs = {}, num = $('pay-num').value.replace(/\s/g, ''), exp = $('pay-exp').value, cvv = $('pay-cvv').value;
      if (num && (num.length < 13 || !luhn(num))) errs['pay-num'] = 'Enter a valid card number (try 4111 1111 1111 1111).';
      if (exp) {
        var m = exp.match(/^(\d{2})\/(\d{2})$/), now = new Date();
        if (!m || +m[1] < 1 || +m[1] > 12) errs['pay-exp'] = 'Use the format MM/YY.';
        else if (2000 + +m[2] < now.getFullYear() || (2000 + +m[2] === now.getFullYear() && +m[1] < now.getMonth() + 1)) errs['pay-exp'] = 'This card has expired.';
      }
      if (cvv && !/^\d{3,4}$/.test(cvv)) errs['pay-cvv'] = 'The CVV is 3 or 4 digits on the back of the card.';
      return errs;
    }
    form.addEventListener('submit', function (e) {
      if (cardFields.hidden) return;
      var errs = cardErrors(), first = null;
      ['pay-num', 'pay-exp', 'pay-cvv'].forEach(function (id) { var msg = errs[id] || ''; if (msg) { $(id + '-error').textContent = msg; $(id).setAttribute('aria-invalid', 'true'); if (!first) first = $(id); } });
      var empty = Array.prototype.some.call(cardFields.querySelectorAll('input[required]'), function (i) { return !i.value.trim(); });
      if (first && !empty) { e.preventDefault(); e.stopImmediatePropagation(); first.focus(); }
    }, true);
    form.addEventListener('form:success', function () {
      var btn = $('paySubmit'), isNew = !cardFields.hidden, num = $('pay-num').value.replace(/\s/g, '');
      btn.classList.add('is-busy'); btn.textContent = mode === 'pay' ? 'Processing...' : 'Saving...';
      setTimeout(function () {
        btn.classList.remove('is-busy');
        if (isNew && (mode === 'add' || $('paySave').checked)) {
          var ms = D.methods(); ms.push({ id: 'pm' + Date.now(), type: 'card', brand: num[0] === '4' ? 'Visa' : num[0] === '5' ? 'Mastercard' : 'RuPay', last4: num.slice(-4), exp: $('pay-exp').value, primary: !ms.length }); D.saveMethods(ms);
        }
        if (mode === 'pay') {
          var inv = D.invoices(), total = 0;
          inv.forEach(function (v) { if (paying.indexOf(v.id) > -1) { total += you(v); v.status = 'paid'; v.paidOn = D.today(); } });
          D.saveInvoices(inv);
          T.closeModal('m-pay');
          T.toast('Payment of ' + D.inr(total) + ' received. Receipt RCPT-' + Math.floor(100000 + Math.random() * 899999) + ' is in your invoices.', 'ok', 5000);
        } else {
          T.closeModal('m-pay');
          T.toast('Card ending ' + num.slice(-4) + ' saved', 'ok');
        }
        renderBalance(); renderInvoices(); renderMethods();
      }, 900);
    });

    /* payment plan */
    $('planBtn').addEventListener('click', function () { T.openModal('m-plan', this); });
    $('planForm').addEventListener('form:success', function () { T.closeModal('m-plan'); T.toast('Request sent. Our coordinator will call you within two working days.', 'ok'); });

    renderBalance(); renderInvoices(); renderMethods();
    var q = new URLSearchParams(location.search).get('pay');
    if (q && D.invoices().some(function (v) { return v.id === q && open(v); })) openPay([q]);
  });
})();
