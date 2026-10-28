(function(){
  var book = document.getElementById('book');
  var openBtn = document.getElementById('openBtn');
  var pageFrame = document.querySelector('.page-frame');
  var tabs = document.querySelectorAll('.tab');
  var pages = document.querySelectorAll('.page');

  // the folder shows once per visit (per browser tab)
  var seenBefore = false;
  try { seenBefore = sessionStorage.getItem('portfolio-book-opened') === '1'; } catch(e){}

  function openBook(skipAnim){
    if (!book.classList.contains('closed')) return;
    book.classList.remove('closed');
    pageFrame.inert = false;
    if (skipAnim) {
      book.classList.add('opened');
    } else {
      book.classList.add('opening');
      window.setTimeout(function(){ book.classList.add('opened'); }, 1100);
    }
    try { sessionStorage.setItem('portfolio-book-opened', '1'); } catch(e){}
  }

  if (seenBefore) {
    openBook(true);
  } else {
    pageFrame.inert = true;   // pages can't be clicked while the folder is closed
    openBtn.addEventListener('click', function(){ openBook(false); });
    // clicking a tab while the folder is closed opens it too
    tabs.forEach(function(t){ t.addEventListener('click', function(){ openBook(false); }); });
  }

  function goTo(name){
    tabs.forEach(function(t){
      var active = t.getAttribute('data-page') === name;
      t.classList.toggle('active', active);
      if (active) t.setAttribute('aria-current','page'); else t.removeAttribute('aria-current');
    });
    pages.forEach(function(p){
      p.classList.toggle('active', p.id === 'page-' + name);
    });
    if (name === 'works') updateWorks();
  }

  document.querySelectorAll('[data-page]').forEach(function(el){
    el.addEventListener('click', function(){ goTo(el.getAttribute('data-page')); });
  });

  /* ---------- works carousel ---------- */
  var track = document.getElementById('worksTrack');
  var prev = document.getElementById('worksPrev');
  var next = document.getElementById('worksNext');
  var count = document.getElementById('worksCount');
  var cards = track.querySelectorAll('.card');
  var current = 0;   // the first card in view
  var lastClick = 0;

  // One step = the width of one card plus the gap.
  function step(){
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }

  // How many cards fit in view: 2 on a laptop, 1 on a phone.
  function perView(){
    return Math.max(1, Math.round(track.clientWidth / step()));
  }

  function maxIndex(){ return Math.max(0, cards.length - perView()); }

  function goToCard(index){
    current = Math.max(0, Math.min(maxIndex(), index));
    lastClick = Date.now();
    track.scrollTo({ left: current * step() });
    updateWorks();
  }

  function updateWorks(){
    if (!track.clientWidth) return; // works page is hidden
    // While a click is still scrolling, trust `current`, otherwise read the scroll position.
    if (Date.now() - lastClick > 700) current = Math.min(maxIndex(), Math.round(track.scrollLeft / step()));
    var last = Math.min(cards.length, current + perView());
    count.textContent = (last > current + 1)
      ? (current + 1) + '\u2013' + last + ' / ' + cards.length
      : (current + 1) + ' / ' + cards.length;
    prev.disabled = current <= 0;
    next.disabled = current >= maxIndex();
  }

  prev.addEventListener('click', function(){ goToCard(current - perView()); });
  next.addEventListener('click', function(){ goToCard(current + perView()); });

  // Arrow keys work when the row of cards has focus.
  track.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); prev.click(); }
  });

  // A normal mouse wheel moves one card per scroll.
  var wheelLocked = false;
  track.addEventListener('wheel', function(e){
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // sideways trackpad swipe: the browser handles it
    var back = e.deltaY < 0;
    if ((back && prev.disabled) || (!back && next.disabled)) return; // at the end: scroll the page as normal
    e.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    goToCard(current + (back ? -1 : 1));
    setTimeout(function(){ wheelLocked = false; }, 450);
  }, { passive: false });

  /* ---------- open a card: project dialog with all its images ---------- */
  var dialog = document.getElementById('project');
  var viewerImg = document.getElementById('viewerImg');
  var viewerPrev = document.getElementById('viewerPrev');
  var viewerNext = document.getElementById('viewerNext');
  var viewerCount = document.getElementById('viewerCount');
  var thumbs = document.getElementById('thumbs');
  var images = [];   // [{ src, alt }] of the open project
  var shown = 0;
  var openedFrom = null;

  // The images of a card: the ones in .card-gallery, or else the cover image.
  function imagesOf(card){
    var list = card.querySelectorAll('.card-gallery img');
    if (!list.length) list = card.querySelectorAll('img.card-img');
    return Array.prototype.map.call(list, function(img){
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
  }

  function showImage(index){
    shown = (index + images.length) % images.length;
    viewerImg.src = images[shown].src;
    viewerImg.alt = images[shown].alt;
    viewerCount.textContent = (shown + 1) + ' / ' + images.length;
    thumbs.querySelectorAll('button').forEach(function(b, i){
      b.setAttribute('aria-current', i === shown ? 'true' : 'false');
    });
  }

  function openProject(card){
    openedFrom = card.querySelector('.card-open');
    images = imagesOf(card);

    document.getElementById('projectTitle').textContent = card.querySelector('h3').textContent;
    document.getElementById('projectTags').innerHTML = card.querySelector('.card-tags').innerHTML;
    var body = document.getElementById('projectBody');
    body.innerHTML = '';
    card.querySelectorAll(':scope > p').forEach(function(p){ body.appendChild(p.cloneNode(true)); });
    card.querySelectorAll(':scope > .card-link').forEach(function(a){ body.appendChild(a.cloneNode(true)); });

    var hasImages = images.length > 0;
    dialog.querySelector('.viewer').hidden = !hasImages;
    var many = images.length > 1;
    viewerPrev.hidden = viewerNext.hidden = viewerCount.hidden = thumbs.hidden = !many;

    thumbs.innerHTML = '';
    images.forEach(function(image, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show image ' + (i + 1));
      var t = document.createElement('img');
      t.src = image.src;
      t.alt = '';
      b.appendChild(t);
      b.addEventListener('click', function(){ showImage(i); });
      thumbs.appendChild(b);
    });
    if (!hasImages){
      var note = document.createElement('p');
      note.className = 'placeholder-note';
      note.textContent = 'Images coming soon.';
      body.appendChild(note);
    } else {
      showImage(0);
    }

    dialog.showModal();
  }

  cards.forEach(function(card){
    var hint = document.createElement('span');
    hint.className = 'card-more';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'View project \u2192';
    card.appendChild(hint);
    card.querySelector('.card-open').addEventListener('click', function(){ openProject(card); });
  });

  viewerPrev.addEventListener('click', function(){ showImage(shown - 1); });
  viewerNext.addEventListener('click', function(){ showImage(shown + 1); });
  document.getElementById('projectClose').addEventListener('click', function(){ dialog.close(); });

  // Close when clicking the dark area around the dialog.
  dialog.addEventListener('click', function(e){ if (e.target === dialog) dialog.close(); });

  // Left and right arrow keys change the image.
  dialog.addEventListener('keydown', function(e){
    if (images.length < 2) return;
    if (e.key === 'ArrowRight'){ e.preventDefault(); showImage(shown + 1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); showImage(shown - 1); }
  });

  // Back to the card you came from.
  dialog.addEventListener('close', function(){ if (openedFrom) openedFrom.focus(); });

  var ticking = false;
  track.addEventListener('scroll', function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ updateWorks(); ticking = false; });
  });
  window.addEventListener('resize', updateWorks);
})();
