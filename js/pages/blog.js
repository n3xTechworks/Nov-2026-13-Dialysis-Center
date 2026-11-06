/* blog page: chips filter the featured article and the grid together, keep one live count */
(function () {
  var grid = document.getElementById('blogGrid');
  var feature = document.getElementById('featureWrap');
  var count = document.getElementById('blogCount');
  var empty = document.getElementById('blogEmpty');
  if (!grid) return;
  grid.addEventListener('filter:change', function (e) {
    var key = e.detail.key;
    var featOn = key === 'all' || (feature.querySelector('[data-group]').getAttribute('data-group') || '').split(/\s+/).indexOf(key) > -1;
    feature.hidden = !featOn;
    var n = e.detail.shown + (featOn ? 1 : 0);
    var label = key === 'all' ? 'Showing all 7 articles' : 'Showing ' + n + ' article' + (n === 1 ? '' : 's') + ' on ' + document.querySelector('[data-filter="' + key + '"]').textContent;
    count.textContent = label;
    grid.hidden = e.detail.shown === 0;
    if (empty) empty.hidden = e.detail.shown !== 0;
  });
})();
