(function(){
  var cover = document.getElementById('cover');
  var book = document.getElementById('book');
  var openBtn = document.getElementById('openBtn');
  var tabs = document.querySelectorAll('.tab');
  var pages = document.querySelectorAll('.page');

  var seenBefore = false;
  try { seenBefore = localStorage.getItem('portfolio-book-opened') === '1'; } catch(e){}

  function openBook(skipAnim){
    book.hidden = false;
    if (skipAnim) {
      cover.classList.add('hidden');
    } else {
      cover.classList.add('opened');
      window.setTimeout(function(){ cover.classList.add('hidden'); }, 950);
    }
    try { localStorage.setItem('portfolio-book-opened', '1'); } catch(e){}
  }

  if (seenBefore) {
    openBook(true);
  } else {
    openBtn.addEventListener('click', function(){ openBook(false); });
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
  }

  document.querySelectorAll('[data-page]').forEach(function(el){
    el.addEventListener('click', function(){ goTo(el.getAttribute('data-page')); });
  });
})();