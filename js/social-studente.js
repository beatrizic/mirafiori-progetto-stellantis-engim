import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, SCENARI, SCALA,
  DOMANDA_SCELTA, DOMANDA_PRIMA, DOMANDA_DOPO,
  TESTO_FINALE, DOMANDA_RIFLESSIONE, OPZIONI_RIFLESSIONE
} from './social-dati.js';
import { generaAnonymousId } from './attivita-logica.js';

const CHIAVE_ANON = 'mirafiori_anon_id';

const el = (id) => document.getElementById(id);
const schermi = () => [el('schermo-stato'), el('schermo-gioco'), el('schermo-fine')];
const fasi = () => [el('fase-scelta'), el('fase-prima'), el('fase-dopo'), el('fase-debrief')];

let sessione = null;
let partecipante = null;
let indiceScenario = 0;
let fase = 'scelta';           // scelta | prima | dopo | debrief
let momentoScelto = null;
let votoCorrente = null;
let riflessioneInviata = false;

function mostraSchermo(s) {
  schermi().forEach((x) => x.classList.add('nascosto'));
  s.classList.remove('nascosto');
}

function mostraFase(f) {
  fasi().forEach((x) => x.classList.add('nascosto'));
  f.classList.remove('nascosto');
  f.classList.remove('anim-entrata');
  void f.offsetWidth;            // forza il restart dell'animazione
  f.classList.add('anim-entrata');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function messaggio(titolo, testo, errore = false) {
  el('stato-titolo').textContent = titolo;
  el('stato-testo').textContent = testo;
  el('stato-testo').className = errore ? 'avviso' : 'grigio';
  mostraSchermo(el('schermo-stato'));
}

function anonId() {
  let id = sessionStorage.getItem(CHIAVE_ANON);
  if (!id) { id = generaAnonymousId(); sessionStorage.setItem(CHIAVE_ANON, id); }
  return id;
}

// ---------- avvio ----------

async function avvia() {
  const codice = new URLSearchParams(location.search).get('s');
  if (!codice) { messaggio('Link non valido', 'Inquadra di nuovo il QR code mostrato in aula.', true); return; }

  const { data, error } = await supabase
    .from('attivita_sessioni').select('*').eq('codice', codice.toUpperCase()).maybeSingle();

  if (error || !data) { messaggio('Sessione non trovata', 'Controlla di aver inquadrato il QR code giusto.', true); return; }

  sessione = data;
  await sincronizza();

  supabase.channel('sessione-social-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  if (sessione.stato === 'waiting')   { messaggio('Quasi pronti', 'La sessione non è ancora iniziata.'); return; }
  if (sessione.stato === 'completed') { messaggio('Attività conclusa', 'Questa attività è terminata.'); return; }

  if (!partecipante && !(await registraPartecipante())) return;

  if (sessione.stato === 'locked' && indiceScenario < SCENARI.length) {
    messaggio('Risposte chiuse', 'Le risposte sono state chiuse.'); return;
  }

  if (indiceScenario >= SCENARI.length) { renderFine(); return; }

  mostraSchermo(el('schermo-gioco'));
  renderAvanzamento();
  if (fase === 'scelta')      renderScelta();
  else if (fase === 'prima')  renderPrima();
  else if (fase === 'dopo')   renderDopo();
  else                        renderDebrief();
}

async function registraPartecipante() {
  const anonymous = anonId();

  const { data: esistente } = await supabase
    .from('attivita_partecipanti').select('*')
    .eq('sessione_id', sessione.id).eq('anonymous_id', anonymous).maybeSingle();

  if (esistente) { partecipante = esistente; await ripristina(); return true; }

  const { data, error } = await supabase
    .from('attivita_partecipanti')
    .insert({ sessione_id: sessione.id, anonymous_id: anonymous })
    .select().single();

  if (error) { messaggio('Connessione non riuscita', 'Prova a ricaricare la pagina.', true); return false; }
  partecipante = data;
  return true;
}

/** Ricarica: riprende esattamente dal punto in cui si era interrotto. */
async function ripristina() {
  const { data } = await supabase
    .from('attivita_risposte_generiche').select('scenario_id, tipo, valore')
    .eq('sessione_id', sessione.id).eq('partecipante_id', partecipante.id);

  const risposte = data || [];
  riflessioneInviata = risposte.some((r) => r.tipo === 'final_reflection');

  for (let i = 0; i < SCENARI.length; i++) {
    const s = SCENARI[i];
    const perScenario = risposte.filter((r) => r.scenario_id === s.id);
    const scelta = perScenario.find((r) => r.tipo === 'selected_moment');
    const prima  = perScenario.find((r) => r.tipo === 'rating_before');
    const dopo   = perScenario.find((r) => r.tipo === 'rating_after');

    if (!scelta) { indiceScenario = i; fase = 'scelta'; return; }
    if (!prima)  { indiceScenario = i; fase = 'prima'; momentoScelto = scelta.valore; return; }
    if (!dopo)   { indiceScenario = i; fase = 'dopo';  momentoScelto = scelta.valore; return; }
  }
  indiceScenario = SCENARI.length;
}

// ---------- salvataggio ----------

async function salva(tipo, valore) {
  const { error } = await supabase.from('attivita_risposte_generiche').insert({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    activity_key: ACTIVITY_KEY,
    scenario_id: SCENARI[indiceScenario]?.id ?? 'finale',
    tipo,
    valore: String(valore)
  });
  // 23505 = già registrata (doppio tap): si prosegue.
  return !error || error.code === '23505';
}

// ---------- avanzamento ----------

function renderAvanzamento() {
  const cont = el('pallini');
  cont.innerHTML = '';
  SCENARI.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'pallino' + (i < indiceScenario ? ' fatto' : i === indiceScenario ? ' attivo' : '');
    cont.appendChild(d);
  });
  el('etichetta-avanzamento').textContent = `Scenario ${indiceScenario + 1} di ${SCENARI.length}`;
}

// ---------- FASE 1: scelta ----------

function renderScelta() {
  const s = SCENARI[indiceScenario];
  momentoScelto = null;

  el('titolo-scenario').textContent = s.titolo;
  el('intro-scenario').textContent = s.intro || '';
  el('domanda-scelta').textContent = DOMANDA_SCELTA;

  const griglia = el('griglia-momenti');
  griglia.innerHTML = '';
  s.momenti.forEach((m) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-momento';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `${m.alt}. Didascalia: ${m.testoBreve}`);

    const img = document.createElement('img');
    img.src = m.immagine; img.alt = m.alt; img.loading = 'lazy';
    img.onerror = () => { img.style.background = '#dde3ee'; img.alt = 'Immagine non disponibile'; };

    const cap = document.createElement('span');
    cap.className = 'didascalia';
    cap.textContent = m.testoBreve;

    btn.append(img, cap);
    btn.addEventListener('click', () => {
      momentoScelto = m.id;
      [...griglia.querySelectorAll('.card-momento')].forEach((b, i) =>
        b.setAttribute('aria-pressed', s.momenti[i].id === m.id ? 'true' : 'false'));
      el('btn-scelta').disabled = false;
    });

    li.appendChild(btn);
    griglia.appendChild(li);
  });

  el('btn-scelta').disabled = true;
  el('btn-scelta').textContent = 'Conferma';
  mostraFase(el('fase-scelta'));
}

el('btn-scelta').addEventListener('click', async () => {
  if (!momentoScelto) return;
  el('btn-scelta').disabled = true;
  el('btn-scelta').textContent = 'Un attimo…';
  if (!(await salva('selected_moment', momentoScelto))) {
    el('btn-scelta').disabled = false;
    el('btn-scelta').textContent = 'Riprova';
    return;
  }
  fase = 'prima';
  renderPrima();
});

// ---------- scala 1-10 riutilizzabile ----------

function costruisciScala(contenitore, bottone, onScelta) {
  contenitore.innerHTML = '';
  votoCorrente = null;
  for (let v = SCALA.min; v <= SCALA.max; v++) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voto';
    btn.textContent = v;
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `${v} su ${SCALA.max}`);
    btn.addEventListener('click', () => {
      votoCorrente = v;
      [...contenitore.querySelectorAll('.voto')].forEach((b) =>
        b.setAttribute('aria-pressed', Number(b.textContent) === v ? 'true' : 'false'));
      bottone.disabled = false;
      if (onScelta) onScelta(v);
    });
    li.appendChild(btn);
    contenitore.appendChild(li);
  }
  bottone.disabled = true;
  bottone.textContent = 'Conferma';
}

// ---------- FASE 2-3: YES + valutazione prima ----------

function renderPrima() {
  const s = SCENARI[indiceScenario];
  const m = s.momenti.find((x) => x.id === momentoScelto) || s.momenti[0];

  const box = el('scelta-grande');
  box.innerHTML = '';
  const img = document.createElement('img');
  img.src = m.immagine; img.alt = m.alt;
  img.onerror = () => { img.alt = 'Immagine non disponibile'; };
  const cap = document.createElement('span');
  cap.className = 'didascalia';
  cap.textContent = m.testoBreve;
  box.append(img, cap);

  el('domanda-prima').textContent = DOMANDA_PRIMA;
  costruisciScala(el('scala-prima'), el('btn-prima'));
  mostraFase(el('fase-prima'));
}

el('btn-prima').addEventListener('click', async () => {
  if (!votoCorrente) return;
  el('btn-prima').disabled = true;
  el('btn-prima').textContent = 'Un attimo…';
  if (!(await salva('rating_before', votoCorrente))) {
    el('btn-prima').disabled = false;
    el('btn-prima').textContent = 'Riprova';
    return;
  }
  fase = 'dopo';
  renderDopo();
});

// ---------- FASE 4-5: BUT + valutazione dopo ----------

function renderDopo() {
  const s = SCENARI[indiceScenario];
  const griglia = el('griglia-contesto');
  griglia.innerHTML = '';

  s.momenti.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'card-contesto' + (m.id === momentoScelto ? ' scelta' : '');

    const img = document.createElement('img');
    img.src = m.immagine; img.alt = m.alt; img.loading = 'lazy';
    img.onerror = () => { img.alt = 'Immagine non disponibile'; };

    const cap = document.createElement('span');
    cap.className = 'didascalia';
    cap.textContent = m.testoBreve;

    li.append(img, cap);
    if (m.id === momentoScelto) {
      const tag = document.createElement('span');
      tag.className = 'tag-scelta';
      tag.textContent = 'Il tuo';
      li.appendChild(tag);
    }
    griglia.appendChild(li);
  });

  el('domanda-dopo').textContent = DOMANDA_DOPO;
  costruisciScala(el('scala-dopo'), el('btn-dopo'));
  mostraFase(el('fase-dopo'));
}

el('btn-dopo').addEventListener('click', async () => {
  if (!votoCorrente) return;
  el('btn-dopo').disabled = true;
  el('btn-dopo').textContent = 'Un attimo…';
  if (!(await salva('rating_after', votoCorrente))) {
    el('btn-dopo').disabled = false;
    el('btn-dopo').textContent = 'Riprova';
    return;
  }
  fase = 'debrief';
  renderDebrief();
});

// ---------- FASE 6: micro-debrief ----------

function renderDebrief() {
  el('testo-debrief').textContent = SCENARI[indiceScenario].debrief;
  mostraFase(el('fase-debrief'));
}

el('btn-continua').addEventListener('click', async () => {
  indiceScenario++;
  fase = 'scelta';
  momentoScelto = null;

  if (indiceScenario >= SCENARI.length) {
    await supabase.from('attivita_partecipanti')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', partecipante.id);
    renderFine();
    return;
  }
  renderAvanzamento();
  renderScelta();
});

// ---------- schermata finale ----------

function renderFine() {
  const box = el('fine-testo');
  box.innerHTML = '';
  TESTO_FINALE.forEach((riga) => {
    const p = document.createElement('p');
    p.textContent = riga;
    box.appendChild(p);
  });

  el('domanda-riflessione').textContent = DOMANDA_RIFLESSIONE;

  const cont = el('opzioni-riflessione');
  cont.innerHTML = '';

  if (riflessioneInviata) {
    el('blocco-riflessione').classList.add('nascosto');
  } else {
    el('blocco-riflessione').classList.remove('nascosto');
    OPZIONI_RIFLESSIONE.forEach((o) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'voto';
      btn.style.fontSize = '1rem';
      btn.textContent = o.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', async () => {
        [...cont.querySelectorAll('.voto')].forEach((b) => { b.disabled = true; });
        btn.setAttribute('aria-pressed', 'true');
        // Salvata fuori dal ciclo scenari: nessun punteggio, nessuna classifica.
        await supabase.from('attivita_risposte_generiche').insert({
          sessione_id: sessione.id,
          partecipante_id: partecipante.id,
          activity_key: ACTIVITY_KEY,
          scenario_id: 'finale',
          tipo: 'final_reflection',
          valore: o.id
        });
        riflessioneInviata = true;
        el('blocco-riflessione').classList.add('nascosto');
      });
      li.appendChild(btn);
      cont.appendChild(li);
    });
  }

  mostraSchermo(el('schermo-fine'));
}

// ---------- error handling ----------

window.addEventListener('unhandledrejection', () => {
  if (!el('schermo-stato').classList.contains('nascosto')) {
    messaggio('Connessione persa', 'Sto provando a riconnettermi. Se non succede nulla, ricarica la pagina.', true);
  }
});

avvia();
