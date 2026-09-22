// ============================================================
//  NAVIGAZIONE DEL SITO
//  Un solo file per tutte le pagine: per aggiungere o togliere
//  un link si modifica solo l'array LINK qui sotto.
//
//  Uso nelle pagine del sito:
//    <header class="barra" id="barra"></header>
//    <script src="js/nav.js"></script>
//
//  Uso nelle pagine degli studenti (solo pulsante per uscire):
//    <header id="barra" data-modo="gioco" data-avviso="…"></header>
//    <script src="js/nav.js"></script>
// ============================================================

(function () {
  const LINK = [
    { href: 'index.html', label: 'Home' },
    { href: 'percorso.html', label: 'Il percorso' },
    {
      label: 'Temi',
      figli: [
        { href: 'tema-stereotipi.html', label: 'Stereotipi di genere' },
        { href: 'tema-rappresentazione-media.html', label: 'Social e realtà' },
        { href: 'tema-gender-pay-gap.html', label: 'Prompt e IA' },
        { href: 'tema-cyberbullismo.html', label: 'Cyberbullismo' }
      ]
    },
    { href: 'regia-quiz-iniziale.html', label: 'Quiz iniziale' }
  ];

  const header = document.getElementById('barra');
  if (!header) return;

  const paginaCorrente = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const eCorrente = (href) => href.toLowerCase() === paginaCorrente;

  aggiungiStili();

  if (header.dataset.modo === 'gioco') { barraGioco(); return; }
  barraSito();

  // ---------- barra delle pagine del sito ----------

  function barraSito() {
    header.classList.add('barra');
    header.innerHTML = '';

    const nav = document.createElement('nav');
    nav.className = 'nav-sito';
    nav.setAttribute('aria-label', 'Navigazione principale');

    const marchio = document.createElement('a');
    marchio.className = 'nav-marchio';
    marchio.href = 'index.html';
    marchio.textContent = 'Mirafiori';

    const hamburger = document.createElement('button');
    hamburger.type = 'button';
    hamburger.className = 'nav-hamburger';
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav-voci');
    hamburger.setAttribute('aria-label', 'Apri il menu');
    hamburger.innerHTML = '<span></span><span></span><span></span>';

    const voci = document.createElement('ul');
    voci.className = 'nav-voci';
    voci.id = 'nav-voci';

    LINK.forEach((l) => {
      const li = document.createElement('li');
      if (l.figli) li.appendChild(menuTendina(l));
      else li.appendChild(linkSemplice(l));
      voci.appendChild(li);
    });

    hamburger.addEventListener('click', () => {
      const aperto = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!aperto));
      hamburger.setAttribute('aria-label', aperto ? 'Apri il menu' : 'Chiudi il menu');
      voci.classList.toggle('aperto', !aperto);
    });

    nav.append(marchio, hamburger, voci);
    header.appendChild(nav);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      chiudiTendine();
      hamburger.setAttribute('aria-expanded', 'false');
      voci.classList.remove('aperto');
    });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) chiudiTendine(); });
  }

  function linkSemplice(l) {
    const a = document.createElement('a');
    a.href = l.href;
    a.textContent = l.label;
    if (eCorrente(l.href)) a.setAttribute('aria-current', 'page');
    return a;
  }

  function menuTendina(l) {
    const box = document.createElement('div');
    box.className = 'nav-tendina';

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'nav-tendina-btn';
    b.setAttribute('aria-expanded', 'false');
    b.textContent = l.label;
    if (l.figli.some((f) => eCorrente(f.href))) b.classList.add('corrente');

    const lista = document.createElement('ul');
    lista.className = 'nav-tendina-lista';
    l.figli.forEach((f) => {
      const li = document.createElement('li');
      li.appendChild(linkSemplice(f));
      lista.appendChild(li);
    });

    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const aperto = b.getAttribute('aria-expanded') === 'true';
      chiudiTendine();
      b.setAttribute('aria-expanded', String(!aperto));
      box.classList.toggle('aperta', !aperto);
    });

    box.append(b, lista);
    return box;
  }

  function chiudiTendine() {
    header.querySelectorAll('.nav-tendina').forEach((t) => {
      t.classList.remove('aperta');
      t.querySelector('.nav-tendina-btn').setAttribute('aria-expanded', 'false');
    });
  }

  // ---------- barra delle pagine studente ----------

  function barraGioco() {
    header.className = 'barra-gioco';
    header.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-esci';
    b.innerHTML = '<span aria-hidden="true">&#10005;</span> Esci';
    b.addEventListener('click', () => {
      const avviso = header.dataset.avviso || 'Le risposte già date restano salvate.';
      if (confirm('Vuoi uscire e tornare alla home?\n' + avviso)) location.href = 'index.html';
    });
    header.appendChild(b);
  }

  // ---------- stili ----------

  function aggiungiStili() {
    if (document.getElementById('stili-nav')) return;
    const s = document.createElement('style');
    s.id = 'stili-nav';
    s.textContent = `
      .barra { justify-content: space-between !important; padding: 0.7rem 1.4rem !important; }
      .barra nav.nav-sito { display: flex; align-items: center; justify-content: space-between; gap: 1.2rem; width: 100%; max-width: 1240px; margin: 0 auto; position: relative; }
      .nav-marchio { font-family: var(--font-display); font-size: 1.4rem; color: var(--blu) !important; text-decoration: none; letter-spacing: 0.02em; }
      .nav-voci { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 0.3rem; }
      .nav-voci a, .nav-tendina-btn {
        display: block; padding: 0.5rem 0.85rem; border-radius: 999px;
        font-family: var(--font-testo); font-size: 0.92rem; font-weight: 500;
        color: var(--nero) !important; text-decoration: none; background: none; border: 0; cursor: pointer;
      }
      .nav-voci a:hover, .nav-tendina-btn:hover { background: var(--bianco-2); color: var(--accento) !important; }
      .nav-voci a[aria-current="page"], .nav-tendina-btn.corrente { color: var(--blu) !important; font-weight: 700; background: var(--bianco-2); }
      .nav-voci a:focus-visible, .nav-tendina-btn:focus-visible, .nav-hamburger:focus-visible { outline: 3px solid var(--blu-chiaro); outline-offset: 2px; }
      .nav-tendina { position: relative; }
      .nav-tendina-btn::after { content: ' \\25BE'; font-size: 0.75rem; }
      .nav-tendina-lista {
        display: none; position: absolute; top: calc(100% + 0.4rem); left: 50%; transform: translateX(-50%);
        list-style: none; margin: 0; padding: 0.4rem; min-width: 220px; text-align: left;
        background: #fff; border: 1px solid var(--linea); border-radius: 14px; box-shadow: 0 12px 32px rgba(14,42,82,0.14); z-index: 60;
      }
      .nav-tendina.aperta .nav-tendina-lista { display: block; }
      .nav-tendina-lista a { border-radius: 10px; }
      .nav-hamburger { display: none; width: 44px; height: 44px; border: 0; background: none; cursor: pointer; padding: 10px; border-radius: 10px; }
      .nav-hamburger span { display: block; height: 2px; background: var(--blu); margin: 5px 0; border-radius: 2px; transition: transform 0.2s ease, opacity 0.2s ease; }
      .nav-hamburger[aria-expanded="true"] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .nav-hamburger[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
      .nav-hamburger[aria-expanded="true"] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      @media (max-width: 820px) {
        .nav-hamburger { display: block; }
        .nav-voci {
          display: none; position: absolute; top: calc(100% + 0.7rem); left: -1.4rem; right: -1.4rem;
          flex-direction: column; align-items: stretch; gap: 0; padding: 0.6rem 1rem 1rem;
          background: #fff; border-bottom: 1px solid var(--linea); box-shadow: 0 16px 30px rgba(14,42,82,0.12); text-align: left;
        }
        .nav-voci.aperto { display: flex; }
        .nav-voci a, .nav-tendina-btn { padding: 0.85rem 0.6rem; border-radius: 10px; width: 100%; text-align: left; font-size: 1rem; }
        .nav-tendina-btn::after { content: ''; }
        .nav-tendina-btn { color: var(--grigio) !important; font-size: 0.78rem !important; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; pointer-events: none; padding-bottom: 0.2rem !important; }
        .nav-tendina-lista { display: block; position: static; transform: none; box-shadow: none; border: 0; padding: 0 0 0 0.6rem; min-width: 0; }
      }

      .barra-gioco { display: flex; justify-content: flex-end; padding: 0.6rem 0.9rem; max-width: 640px; margin: 0 auto; }
      .btn-esci {
        display: inline-flex; align-items: center; gap: 0.4rem; min-height: 40px; padding: 0.45rem 0.95rem;
        font-family: var(--font-testo); font-size: 0.85rem; font-weight: 600; color: var(--grigio);
        background: var(--bianco-2); border: 0; border-radius: 999px; cursor: pointer;
      }
      .btn-esci:hover { color: var(--accento); }
      .btn-esci:focus-visible { outline: 3px solid var(--blu-chiaro); outline-offset: 2px; }

      @media (prefers-reduced-motion: reduce) { .nav-hamburger span { transition: none; } }
    `;
    document.head.appendChild(s);
  }
})();
