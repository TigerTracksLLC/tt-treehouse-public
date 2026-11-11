// People who met at a treehouse. party (dates, partners, book clubs). Shown as cards on /connections.
//
// Real stories only, and only with their say-so. Stories come in through the
// "met someone here?" form and land in /review under the Met here tab. To publish
// one, add it here. While this list is empty the cards block stays hidden and
// the page shows the wording alone.
//
//   names   how they asked to be shown: "Sam and Alex", or "" to leave names off
//   met     the party they met at, in words: "the Christmas party, 2025"
//   status  what they are now, as shown on the card: "dating", "engaged", "business partners", "book club"
//   quote   one or two lines in their words (optional)
window.TH_COUPLES = [
];

(function () {
  var list = (window.TH_COUPLES || []).filter(function (c) { return c && c.met && c.status; });
  var wrap = document.getElementById('stories');
  var grid = document.getElementById('storiesGrid');
  if (!wrap || !grid || !list.length) return;
  list.forEach(function (c) {
    var card = document.createElement('figure');
    card.className = 'mc-story';
    var status = document.createElement('span');
    status.className = 'mc-story-status';
    status.textContent = c.status;
    card.appendChild(status);
    var names = document.createElement('p');
    names.className = 'mc-story-names';
    names.textContent = c.names || 'two guests';
    card.appendChild(names);
    if (c.quote) {
      var quote = document.createElement('blockquote');
      quote.className = 'mc-story-quote';
      quote.textContent = c.quote;
      card.appendChild(quote);
    }
    var met = document.createElement('figcaption');
    met.className = 'mc-story-met';
    met.textContent = 'met at ' + c.met;
    card.appendChild(met);
    grid.appendChild(card);
  });
  wrap.hidden = false;
})();
