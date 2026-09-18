import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, SFIDE, DOMANDA_PRIMA, DOMANDA_DOPO, TESTO_RIVELA,
  TESTO_FINALE, DOMANDA_RIFLESSIONE, OPZIONI_RIFLESSIONE
} from './prompt-dati.js';
import { mescola, generaAnonymousId } from './attivita-logica.js';

const CHIAVE_ANON = 'mirafiori_anon_id';
const LETTERE = ['A', 'B', 'C', 'D'];

const el = (id) => document.getElementById(id);
const schermi = () => [el('schermo-stato'), el('schermo-gioco'), el('schermo-fine')];
const fasi = () => [el('fase-prima'), el('fase-risposte'), el('fase-debrief')];

let sessione = null;
let partecipante = null;
let indiceSfida = 0;
let fase = 'prima';            // prima | dopo | debrief
let ordineCorrente = [];       // prompt mescolati: l'ordine non deve influenzare la scelta
let sceltaPrima = null;
let sceltaDopo = null;
let riflessioneInviata = false;

const motoRidotto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mostraSchermo(s) {
  schermi().forEach((x) => x.classList.add('nascosto'));
  s.classList.remove('nascosto');
}

function mostraFase(f) {
  fasi().forEach((x) => x.classList.add('nascosto'));
  f.classList.remove('nascosto');
  f.classList.remove('anim-entrata');
  void f.offsetWidth;
  if (!motoRidotto()) f.classList.add('anim-entrata');
  window.scrollTo(0, 0);
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

  supabase.channel('sessione-prompt-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  if (sessione.stato === 'waiting')   { messaggio('Quasi pronti', 'La sessione non è ancora iniziata.'); return; }
  if (sessione.stato === 'completed') { messaggio('Sessione terminata', 'Questa attività è terminata.'); return; }

  if (!partecipante && !(await registraPartecipante())) return;

  if (sessione.stato === 'locked' && indiceSfida < SFIDE.length) {
    messaggio('Risposte chiuse', 'Le risposte sono state chiuse.'); return;
  }

  if (indiceSfida >= SFIDE.length) { renderFine(); return; }

  mostraSchermo(el('schermo-gioco'));
  renderAvanzamento();
  if (fase === 'prima')      renderPrima();
  else if (fase === 'dopo')  renderRisposte();
  else                       renderDebrief();
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

/** Ricarica: riprende da sfida e fase esatte, senza duplicare risposte. */
async function ripristina() {
  const { data } = await supabase
    .from('attivita_risposte_generiche').select('scenario_id, tipo, valore')
    .eq('sessione_id', sessione.id).eq('partecipante_id', partecipante.id);

  const risposte = data || [];
  riflessioneInviata = risposte.some((r) => r.tipo === 'final_reflection');

  for (let i = 0; i < SFIDE.length; i++) {
    const perSfida = risposte.filter((r) => r.scenario_id === SFIDE[i].id);
    const prima = perSfida.find((r) => r.tipo === 'scelta_prima');
    const dopo  = perSfida.find((r) => r.tipo === 'scelta_dopo');

    if (!prima) { indiceSfida = i; fase = 'prima'; return; }
    if (!dopo)  { indiceSfida = i; fase = 'dopo'; sceltaPrima = prima.valore; return; }
  }
  indiceSfida = SFIDE.length;
}

// ---------- salvataggio ----------

async function salva(tipo, valore) {
  const { error } = await supabase.from('attivita_risposte_generiche').insert({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    activity_key: ACTIVITY_KEY,
    scenario_id: SFIDE[indiceSfida]?.id ?? 'finale',
    tipo,
    valore: String(valore)
  });
  // 23505 = risposta già registrata (doppio tap): si prosegue.
  return !error || error.code === '23505';
}

// ---------- avanzamento ----------

function renderAvanzamento() {
  const cont = el('pallini');
  cont.innerHTML = '';
  SFIDE.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'pallino' + (i < indiceSfida ? ' fatto' : i === indiceSfida ? ' attivo' : '');
    cont.appendChild(d);
  });
  el('etichetta-avanzamento').textContent = `Sfida ${indiceSfida + 1} di ${SFIDE.length}`;
}

// ---------- lista di prompt selezionabili ----------

function costruisciLista(contenitore, bottone, onScelta) {
  contenitore.innerHTML = '';
  ordineCorrente.forEach((p, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-prompt';
    btn.setAttribute('aria-pressed', 'false');

    const lettera = document.createElement('span');
    lettera.className = 'etichetta-lettera';
    lettera.textContent = LETTERE[i];
    lettera.setAttribute('aria-hidden', 'true');

    const testo = document.createElement('span');
    testo.textContent = p.testo;

    btn.append(lettera, testo);
    btn.setAttribute('aria-label', `Opzione ${LETTERE[i]}: ${p.testo}`);
    btn.addEventListener('click', () => {
      onScelta(p.id);
      [...contenitore.querySelectorAll('.card-prompt')].forEach((b, j) =>
        b.setAttribute('aria-pressed', ordineCorrente[j].id === p.id ? 'true' : 'false'));
      bottone.disabled = false;
    });

    li.appendChild(btn);
    contenitore.appendChild(li);
  });
  bottone.disabled = true;
  bottone.textContent = 'Conferma';
}

// ---------- FASE 1: scelta al buio ----------

function renderPrima() {
  const s = SFIDE[indiceSfida];
  sceltaPrima = null;
  // L'ordine è mescolato una volta per sfida e resta lo stesso anche dopo la rivelazione.
  ordineCorrente = mescola(s.prompt);

  el('titolo-sfida').textContent = s.titolo;
  el('obiettivo').textContent = s.obiettivo;
  el('domanda-prima').textContent = DOMANDA_PRIMA;

  costruisciLista(el('lista-prima'), el('btn-prima'), (id) => { sceltaPrima = id; });
  mostraFase(el('fase-prima'));
}

el('btn-prima').addEventListener('click', async () => {
  if (!sceltaPrima) return;
  el('btn-prima').disabled = true;
  el('btn-prima').textContent = 'Un attimo…';
  if (!(await salva('scelta_prima', sceltaPrima))) {
    el('btn-prima').disabled = false;
    el('btn-prima').textContent = 'Impossibile inviare. Riprova.';
    return;
  }
  fase = 'dopo';
  renderRisposte();
});

// ---------- FASE 2: risposte reali + seconda scelta ----------

function renderRisposte() {
  const s = SFIDE[indiceSfida];
  if (!ordineCorrente.length) ordineCorrente = mescola(s.prompt);
  sceltaDopo = null;

  el('testo-rivela').textContent = TESTO_RIVELA;

  const cont = el('contenitore-risposte');
  cont.innerHTML = '';
  ordineCorrente.forEach((p, i) => {
    const box = document.createElement('article');
    box.className = 'blocco-risposta' + (p.id === sceltaPrima ? ' tua' : '');

    const testa = document.createElement('div');
    testa.className = 'intestazione-risposta';
    const lettera = document.createElement('span');
    lettera.className = 'etichetta-lettera';
    lettera.textContent = LETTERE[i];
    testa.appendChild(lettera);
    if (p.id === sceltaPrima) {
      const tag = document.createElement('span');
      tag.className = 'tag-tuo';
      tag.textContent = 'LA TUA';
      testa.appendChild(tag);
    }

    const prompt = document.createElement('p');
    prompt.className = 'testo-prompt';
    prompt.textContent = p.testo;

    const risposta = document.createElement('div');
    risposta.className = 'testo-risposta';
    risposta.textContent = p.risposta;

    const commento = document.createElement('p');
    commento.className = 'commento';
    commento.textContent = p.commento;

    box.append(testa, prompt, risposta, commento);
    cont.appendChild(box);
  });

  el('domanda-dopo').textContent = DOMANDA_DOPO;
  costruisciLista(el('lista-dopo'), el('btn-dopo'), (id) => { sceltaDopo = id; });
  mostraFase(el('fase-risposte'));
}

el('btn-dopo').addEventListener('click', async () => {
  if (!sceltaDopo) return;
  el('btn-dopo').disabled = true;
  el('btn-dopo').textContent = 'Un attimo…';
  if (!(await salva('scelta_dopo', sceltaDopo))) {
    el('btn-dopo').disabled = false;
    el('btn-dopo').textContent = 'Impossibile inviare. Riprova.';
    return;
  }
  fase = 'debrief';
  renderDebrief();
});

// ---------- FASE 3: micro-debrief ----------

function renderDebrief() {
  el('testo-debrief').textContent = SFIDE[indiceSfida].debrief;
  mostraFase(el('fase-debrief'));
}

el('btn-continua').addEventListener('click', async () => {
  indiceSfida++;
  fase = 'prima';
  ordineCorrente = [];

  if (indiceSfida >= SFIDE.length) {
    await supabase.from('attivita_partecipanti')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', partecipante.id);
    renderFine();
    return;
  }
  renderAvanzamento();
  renderPrima();
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
      btn.textContent = o.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', async () => {
        [...cont.querySelectorAll('.voto')].forEach((b) => { b.disabled = true; });
        btn.setAttribute('aria-pressed', 'true');
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
