import { supabase } from './supabase-client.js';
import { QUESITI, PROFILO_RETRIBUZIONE, FASCE_RETRIBUZIONE, TESTO_FINALE, TESTO_FINALE_DOMANDA } from './stereotipi-dati.js';
import { mescola, generaAnonymousId, assegnaVariante } from './stereotipi-logica.js';

const CHIAVE_ANON = 'mirafiori_anon_id';

const el = {
  stato: document.getElementById('schermo-stato'),
  statoTitolo: document.getElementById('stato-titolo'),
  statoTesto: document.getElementById('stato-testo'),
  quiz: document.getElementById('schermo-quiz'),
  retribuzione: document.getElementById('schermo-retribuzione'),
  fine: document.getElementById('schermo-fine'),
  ritratto: document.getElementById('ritratto'),
  opzioni: document.getElementById('opzioni'),
  conferma: document.getElementById('btn-conferma'),
  avanzTesto: document.getElementById('avanzamento-testo'),
  avanzRiemp: document.getElementById('avanzamento-riempimento'),
  retrNome: document.getElementById('retr-nome'),
  retrDettagli: document.getElementById('retr-dettagli'),
  retrOpzioni: document.getElementById('retr-opzioni'),
  retrConferma: document.getElementById('retr-conferma'),
  fineTesto: document.getElementById('fine-testo'),
  fineDomanda: document.getElementById('fine-domanda')
};

let sessione = null;
let partecipante = null;
let indice = 0;
let sceltaCorrente = null;
let opzioniMescolate = [];
let quizCompletato = false;
let retribuzioneInviata = false;

function mostra(schermo) {
  [el.stato, el.quiz, el.retribuzione, el.fine].forEach((s) => s.classList.add('nascosto'));
  schermo.classList.remove('nascosto');
}

function messaggio(titolo, testo, errore = false) {
  el.statoTitolo.textContent = titolo;
  el.statoTesto.textContent = testo;
  el.statoTesto.className = errore ? 'avviso' : 'grigio';
  mostra(el.stato);
}

function codiceDaUrl() {
  return new URLSearchParams(window.location.search).get('s');
}

function anonId() {
  let id = sessionStorage.getItem(CHIAVE_ANON);
  if (!id) {
    id = generaAnonymousId();
    sessionStorage.setItem(CHIAVE_ANON, id);
  }
  return id;
}

// ---------- avvio ----------

async function avvia() {
  const codice = codiceDaUrl();
  if (!codice) {
    messaggio('Link non valido', 'Inquadra di nuovo il QR code mostrato in aula.', true);
    return;
  }

  const { data, error } = await supabase
    .from('attivita_sessioni')
    .select('*')
    .eq('codice', codice.toUpperCase())
    .maybeSingle();

  if (error || !data) {
    messaggio('Sessione non trovata', 'Controlla di aver inquadrato il QR code giusto.', true);
    return;
  }

  sessione = data;
  await sincronizzaStato();

  supabase
    .channel('sessione-studente-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (payload) => { sessione = payload.new; await sincronizzaStato(); })
    .subscribe();
}

async function sincronizzaStato() {
  if (sessione.stato === 'waiting') {
    messaggio('Quasi pronti', 'La sessione non è ancora iniziata.');
    return;
  }
  if (sessione.stato === 'completed') {
    messaggio('Attività conclusa', 'Questa attività è terminata.');
    return;
  }

  if (!partecipante) {
    const ok = await registraPartecipante();
    if (!ok) return;
  }

  if (sessione.stato === 'locked' && !quizCompletato) {
    messaggio('Risposte chiuse', 'Le risposte sono state chiuse.');
    return;
  }

  if (!quizCompletato) { renderQuesito(); return; }

  if (sessione.fase === 'retribuzione' && !retribuzioneInviata) { renderRetribuzione(); return; }

  renderFine();
}

async function registraPartecipante() {
  const anonymous = anonId();

  // Il refresh non deve creare un secondo partecipante.
  const { data: esistente } = await supabase
    .from('attivita_partecipanti')
    .select('*')
    .eq('sessione_id', sessione.id)
    .eq('anonymous_id', anonymous)
    .maybeSingle();

  if (esistente) {
    partecipante = esistente;
    await ripristinaAvanzamento();
    return true;
  }

  const { data, error } = await supabase
    .from('attivita_partecipanti')
    .insert({ sessione_id: sessione.id, anonymous_id: anonymous, variante: assegnaVariante() })
    .select()
    .single();

  if (error) {
    messaggio('Connessione non riuscita', 'Prova a ricaricare la pagina.', true);
    return false;
  }
  partecipante = data;
  return true;
}

/** Ricarica: riprende da dove si era interrotto senza duplicare risposte. */
async function ripristinaAvanzamento() {
  const { data: risposte } = await supabase
    .from('attivita_risposte')
    .select('domanda_id')
    .eq('sessione_id', sessione.id)
    .eq('partecipante_id', partecipante.id);

  const fatte = new Set((risposte || []).map((r) => r.domanda_id));
  indice = QUESITI.findIndex((q) => !fatte.has(q.id));
  if (indice === -1) { indice = QUESITI.length; quizCompletato = true; }

  const { data: retr } = await supabase
    .from('attivita_retribuzione')
    .select('id')
    .eq('sessione_id', sessione.id)
    .eq('partecipante_id', partecipante.id)
    .maybeSingle();
  retribuzioneInviata = !!retr;
}

// ---------- quiz professioni ----------

function renderQuesito() {
  const q = QUESITI[indice];
  sceltaCorrente = null;
  opzioniMescolate = mescola(q.professioni);

  el.avanzTesto.textContent = `${indice + 1} / ${QUESITI.length}`;
  el.avanzRiemp.style.width = `${((indice) / QUESITI.length) * 100}%`;
  el.avanzRiemp.parentElement.setAttribute('aria-valuenow', String(indice + 1));

  el.ritratto.src = q.ritratto;
  el.ritratto.alt = q.alt;
  el.ritratto.onerror = () => {
    el.ritratto.alt = 'Immagine non disponibile';
    el.ritratto.style.background = 'var(--bianco-2)';
  };

  el.opzioni.innerHTML = '';
  opzioniMescolate.forEach((p) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opzione';
    btn.textContent = p.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => selezionaOpzione(p.id));
    li.appendChild(btn);
    el.opzioni.appendChild(li);
  });

  el.conferma.disabled = true;
  el.conferma.textContent = 'Conferma';
  mostra(el.quiz);
}

function selezionaOpzione(id) {
  sceltaCorrente = id;
  [...el.opzioni.querySelectorAll('.opzione')].forEach((b, i) => {
    b.setAttribute('aria-pressed', opzioniMescolate[i].id === id ? 'true' : 'false');
  });
  el.conferma.disabled = false;
}

el.conferma.addEventListener('click', async () => {
  if (!sceltaCorrente) return;
  el.conferma.disabled = true;
  el.conferma.textContent = 'Invio…';

  const { error } = await supabase.from('attivita_risposte').insert({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    domanda_id: QUESITI[indice].id,
    opzione_id: sceltaCorrente
  });

  // 23505 = risposta già registrata (doppio tap): si prosegue comunque.
  if (error && error.code !== '23505') {
    el.conferma.disabled = false;
    el.conferma.textContent = 'Riprova';
    return;
  }

  indice++;
  if (indice < QUESITI.length) { renderQuesito(); return; }

  quizCompletato = true;
  await supabase.from('attivita_partecipanti')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', partecipante.id);

  await sincronizzaStato();
});

// ---------- test retribuzione ----------

function renderRetribuzione() {
  const variante = partecipante.variante || 'A';
  el.retrNome.textContent = PROFILO_RETRIBUZIONE[variante].nome;

  el.retrDettagli.innerHTML = '';
  PROFILO_RETRIBUZIONE.comune.forEach((riga) => {
    const li = document.createElement('li');
    li.textContent = riga;
    el.retrDettagli.appendChild(li);
  });

  let scelta = null;
  el.retrOpzioni.innerHTML = '';
  FASCE_RETRIBUZIONE.forEach((f) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opzione';
    btn.textContent = f.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      scelta = f.id;
      [...el.retrOpzioni.querySelectorAll('.opzione')].forEach((b, i) => {
        b.setAttribute('aria-pressed', FASCE_RETRIBUZIONE[i].id === f.id ? 'true' : 'false');
      });
      el.retrConferma.disabled = false;
    });
    li.appendChild(btn);
    el.retrOpzioni.appendChild(li);
  });

  el.retrConferma.disabled = true;
  el.retrConferma.onclick = async () => {
    if (!scelta) return;
    el.retrConferma.disabled = true;
    el.retrConferma.textContent = 'Invio…';
    const { error } = await supabase.from('attivita_retribuzione').insert({
      sessione_id: sessione.id,
      partecipante_id: partecipante.id,
      variante,
      fascia: scelta
    });
    if (error && error.code !== '23505') {
      el.retrConferma.disabled = false;
      el.retrConferma.textContent = 'Riprova';
      return;
    }
    retribuzioneInviata = true;
    renderFine();
  };

  mostra(el.retribuzione);
}

// ---------- fine ----------

function renderFine() {
  el.fineTesto.innerHTML = '';
  TESTO_FINALE.forEach((riga) => {
    const p = document.createElement('p');
    p.textContent = riga;
    el.fineTesto.appendChild(p);
  });

  el.fineDomanda.innerHTML = '';
  TESTO_FINALE_DOMANDA.forEach((riga, i) => {
    const p = document.createElement('p');
    p.textContent = riga;
    if (i === 1) p.className = 'rilievo';
    el.fineDomanda.appendChild(p);
  });

  mostra(el.fine);
}

// ---------- error handling globale ----------

window.addEventListener('unhandledrejection', () => {
  if (el.stato.classList.contains('nascosto')) return;
  messaggio('Connessione interrotta', 'Controlla la rete e ricarica la pagina.', true);
});

avvia();
