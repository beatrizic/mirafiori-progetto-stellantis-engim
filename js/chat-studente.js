import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, PERSONAGGI, VARIANTI, NODI, NODO_INIZIALE,
  MOMENTI_LIMITE, AZIONI_DEBRIEF, COMMENTI_DEBRIEF, ETICHETTE_CATEGORIA,
  TESTO_FINE_SIMULAZIONE, TESTO_NON_COLPA, DOMANDA_LIMITE, DOMANDA_DEBRIEF,
  NOTA_DEBRIEF, TESTO_FINALE
} from './chat-dati.js';
import { generaAnonymousId, assegnaVariante } from './attivita-logica.js';

const CHIAVE_ANON = 'mirafiori_anon_id';

const el = (id) => document.getElementById(id);
const schermi = () => ['schermo-stato', 'schermo-chat', 'schermo-fine-sim', 'schermo-limite', 'schermo-debrief', 'schermo-finale'].map(el);

let sessione = null;
let partecipante = null;
let variante = 'A';
let nodoCorrente = NODO_INIZIALE;
let sceltePrecedenti = {};      // nodoId -> rispostaId
let fase = 'chat';              // chat | fine_sim | limite | debrief | completato
let inAttesa = false;           // blocca il doppio tap
let scrollLibero = false;       // l'utente ha scrollato in alto di sua volontà
let demo = false;               // anteprima docente: non salva nulla

const motoRidotto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const attendi = (ms) => new Promise((r) => setTimeout(r, motoRidotto() ? Math.min(ms, 120) : ms));

function mostra(id) {
  schermi().forEach((s) => s.classList.add('nascosto'));
  const s = el(id);
  s.classList.remove('nascosto');
  if (id === 'schermo-chat') s.style.display = 'flex';
}

function messaggio(titolo, testo, errore = false) {
  el('stato-titolo').textContent = titolo;
  el('stato-testo').textContent = testo;
  el('stato-testo').className = errore ? 'avviso' : 'grigio';
  mostra('schermo-stato');
}

function anonId() {
  let id = sessionStorage.getItem(CHIAVE_ANON);
  if (!id) { id = generaAnonymousId(); sessionStorage.setItem(CHIAVE_ANON, id); }
  return id;
}

const aggressore = () => PERSONAGGI[VARIANTI[variante].aggressore];

// ---------- avvio ----------

async function avvia() {
  const par = new URLSearchParams(location.search);
  demo = par.get('demo') === '1';

  if (demo) {
    variante = par.get('v') === 'B' ? 'B' : 'A';
    preparaTestata();
    mostra('schermo-chat');
    riproduciNodo(nodoCorrente);
    return;
  }

  const codice = par.get('s');
  if (!codice) { messaggio('Link non valido', 'Inquadra di nuovo il QR code mostrato in aula.', true); return; }

  const { data, error } = await supabase
    .from('attivita_sessioni').select('*').eq('codice', codice.toUpperCase()).maybeSingle();

  if (error || !data) { messaggio('Sessione non trovata', 'Controlla di aver inquadrato il QR code giusto.', true); return; }

  sessione = data;
  await sincronizza();

  supabase.channel('sessione-chat-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; if (fase === 'chat') await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  if (sessione.stato === 'waiting')   { messaggio('Quasi pronti', 'La sessione non è ancora iniziata.'); return; }
  if (sessione.stato === 'completed') { messaggio('Sessione terminata', 'Questa attività è terminata.'); return; }

  if (!partecipante && !(await registraPartecipante())) return;

  if (sessione.stato === 'locked' && fase === 'chat') {
    messaggio('Risposte chiuse', 'Le risposte sono state chiuse.'); return;
  }

  preparaTestata();

  if (fase === 'chat')          { mostra('schermo-chat'); ricostruisci(); }
  else if (fase === 'fine_sim') { mostraFineSimulazione(); }
  else if (fase === 'limite')   { mostraLimite(); }
  else if (fase === 'debrief')  { mostraDebrief(); }
  else                          { mostraFinale(); }
}

async function registraPartecipante() {
  const anonymous = anonId();

  const { data: esistente } = await supabase
    .from('attivita_partecipanti').select('*')
    .eq('sessione_id', sessione.id).eq('anonymous_id', anonymous).maybeSingle();

  if (esistente) {
    partecipante = esistente;
    variante = esistente.variante || 'A';
    await ripristina();
    return true;
  }

  variante = assegnaVariante();
  const { data, error } = await supabase
    .from('attivita_partecipanti')
    .insert({ sessione_id: sessione.id, anonymous_id: anonymous, variante })
    .select().single();

  if (error) { messaggio('Connessione non riuscita', 'Prova a ricaricare la pagina.', true); return false; }
  partecipante = data;
  return true;
}

/** Ricarica: ricostruisce il percorso dalle scelte salvate, senza rigiocare le animazioni. */
async function ripristina() {
  const { data } = await supabase
    .from('attivita_risposte_generiche').select('tipo, valore')
    .eq('sessione_id', sessione.id).eq('partecipante_id', partecipante.id);

  const righe = data || [];
  sceltePrecedenti = {};
  righe.filter((r) => r.tipo.startsWith('scelta:')).forEach((r) => {
    sceltePrecedenti[r.tipo.slice(7)] = r.valore;
  });

  // Cammina il grafo seguendo le scelte già fatte.
  nodoCorrente = NODO_INIZIALE;
  const visti = new Set();
  while (sceltePrecedenti[nodoCorrente] && !visti.has(nodoCorrente)) {
    visti.add(nodoCorrente);
    const nodo = NODI[nodoCorrente];
    const scelta = (nodo.risposte || []).find((r) => r.id === sceltePrecedenti[nodoCorrente]);
    if (!scelta) break;
    nodoCorrente = scelta.prossimo;
  }

  if (righe.some((r) => r.tipo === 'completato'))      fase = 'completato';
  else if (righe.some((r) => r.tipo === 'debrief'))    fase = 'completato';
  else if (righe.some((r) => r.tipo === 'limite'))     fase = 'debrief';
  else if (NODI[nodoCorrente]?.finale)                 fase = 'fine_sim';
  else                                                 fase = 'chat';
}

// ---------- salvataggio ----------

async function salva(tipo, valore) {
  if (demo) return true;
  const { error } = await supabase.from('attivita_risposte_generiche').insert({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    activity_key: ACTIVITY_KEY,
    scenario_id: variante,
    tipo,
    valore: String(valore)
  });
  // 23505 = già registrata (doppio tap): si prosegue.
  return !error || error.code === '23505';
}

// ---------- chat ----------

function preparaTestata() {
  const a = aggressore();
  el('avatar').textContent = a.iniziali;
  el('avatar').style.background = a.colore;
  el('chat-username').textContent = a.username;
}

function scrollGiu(forza = false) {
  const c = el('messaggi');
  if (scrollLibero && !forza) { mostraPulsanteNuovo(); return; }
  c.scrollTop = c.scrollHeight;
}

function mostraPulsanteNuovo() {
  if (el('btn-nuovo')) return;
  const b = document.createElement('button');
  b.id = 'btn-nuovo';
  b.type = 'button';
  b.className = 'nuovo-messaggio';
  b.textContent = '\u2193 Nuovo messaggio';
  b.addEventListener('click', () => { scrollLibero = false; b.remove(); scrollGiu(true); });
  el('schermo-chat').appendChild(b);
}

el('messaggi').addEventListener('scroll', () => {
  const c = el('messaggi');
  const inFondo = c.scrollHeight - c.scrollTop - c.clientHeight < 60;
  scrollLibero = !inFondo;
  if (inFondo && el('btn-nuovo')) el('btn-nuovo').remove();
});

function aggiungiBolla(testo, mia) {
  const d = document.createElement('div');
  d.className = 'bolla ' + (mia ? 'inviata' : 'ricevuta');
  d.textContent = testo;
  el('messaggi').appendChild(d);
  scrollGiu();
  return d;
}

function aggiungiEvento(testo, riquadro) {
  const d = document.createElement('div');
  d.className = 'evento' + (riquadro ? ' riquadro' : '');
  d.textContent = testo;
  el('messaggi').appendChild(d);
  scrollGiu();
}

async function mostraScrivendo(ms) {
  const d = document.createElement('div');
  d.className = 'scrivendo';
  d.setAttribute('aria-label', 'Sta scrivendo');
  d.innerHTML = '<span></span><span></span><span></span>';
  el('messaggi').appendChild(d);
  scrollGiu();
  await attendi(ms);
  d.remove();
}

/** Riproduce i messaggi di un nodo, poi mostra le risposte. */
async function riproduciNodo(id, conAnimazione = true) {
  const nodo = NODI[id];
  if (!nodo) {
    messaggio('Simulazione interrotta', 'La simulazione non può continuare. Torna alla pagina iniziale.', true);
    console.error('Nodo narrativo mancante:', id);
    return;
  }

  pulisciRisposte();

  for (const m of nodo.messaggi) {
    const tipo = m.tipo || 'messaggio';
    if (tipo === 'messaggio') {
      if (conAnimazione) await mostraScrivendo(600 + Math.random() * 800);
      aggiungiBolla(m.testo, false);
    } else {
      if (conAnimazione) await attendi(m.attesa || 700);
      aggiungiEvento(m.testo, tipo === 'sistema');
    }
  }

  if (nodo.finale) { await finaleChat(); return; }
  mostraRisposte(nodo);
}

function pulisciRisposte() {
  el('lista-risposte').innerHTML = '';
  el('area-risposte').classList.add('nascosto');
}

function mostraRisposte(nodo) {
  const lista = el('lista-risposte');
  lista.innerHTML = '';
  nodo.risposte.forEach((r) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-risposta';
    b.textContent = r.etichetta;
    b.addEventListener('click', () => scegli(nodo, r));
    li.appendChild(b);
    lista.appendChild(li);
  });
  el('area-risposte').classList.remove('nascosto');
  scrollGiu();
}

async function scegli(nodo, risposta) {
  if (inAttesa) return;
  inAttesa = true;
  [...el('lista-risposte').querySelectorAll('button')].forEach((b) => { b.disabled = true; });

  aggiungiBolla(risposta.etichetta, true);
  pulisciRisposte();

  const ok = await salva('scelta:' + nodo.id, risposta.id);
  if (!ok) {
    inAttesa = false;
    aggiungiEvento('Messaggio non inviato. Tocca di nuovo per riprovare.', true);
    mostraRisposte(nodo);
    return;
  }

  sceltePrecedenti[nodo.id] = risposta.id;
  nodoCorrente = risposta.prossimo;
  inAttesa = false;
  await attendi(500);
  riproduciNodo(nodoCorrente);
}

/** Ricostruzione dopo un refresh: nessuna animazione, si riprende dov'era. */
function ricostruisci() {
  el('messaggi').innerHTML = '';
  let id = NODO_INIZIALE;
  const visti = new Set();

  while (!visti.has(id)) {
    visti.add(id);
    const nodo = NODI[id];
    if (!nodo) break;
    nodo.messaggi.forEach((m) => {
      const tipo = m.tipo || 'messaggio';
      if (tipo === 'messaggio') aggiungiBolla(m.testo, false);
      else aggiungiEvento(m.testo, tipo === 'sistema');
    });
    const sceltaId = sceltePrecedenti[id];
    if (!sceltaId) { if (nodo.finale) { finaleChat(); return; } mostraRisposte(nodo); scrollGiu(true); return; }
    const scelta = (nodo.risposte || []).find((r) => r.id === sceltaId);
    if (!scelta) { mostraRisposte(nodo); return; }
    aggiungiBolla(scelta.etichetta, true);
    id = scelta.prossimo;
  }
  scrollGiu(true);
}

async function finaleChat() {
  pulisciRisposte();
  await attendi(500);
  el('messaggi').classList.add('sfumata');
  await attendi(600);
  fase = 'fine_sim';
  mostraFineSimulazione();
}

// ---------- fine simulazione ----------

function mostraFineSimulazione() {
  el('titolo-fine-sim').textContent = TESTO_FINE_SIMULAZIONE;
  const box = el('testo-non-colpa');
  box.innerHTML = '';
  TESTO_NON_COLPA.forEach((riga) => {
    const p = document.createElement('p');
    p.textContent = riga;
    box.appendChild(p);
  });
  mostra('schermo-fine-sim');
}

el('btn-vai-limite').addEventListener('click', () => { fase = 'limite'; mostraLimite(); });

// ---------- fase 2: il limite ----------

function mostraLimite() {
  el('domanda-limite').textContent = DOMANDA_LIMITE;
  const lista = el('timeline');
  lista.innerHTML = '';
  let scelto = null;

  MOMENTI_LIMITE.forEach((m, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'momento';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `Momento ${i + 1}: ${m.testo}`);

    const n = document.createElement('span');
    n.className = 'numero';
    n.textContent = i + 1;
    n.setAttribute('aria-hidden', 'true');
    const t = document.createElement('span');
    t.textContent = m.testo;

    b.append(n, t);
    b.addEventListener('click', () => {
      scelto = m.id;
      [...lista.querySelectorAll('.momento')].forEach((x, j) =>
        x.setAttribute('aria-pressed', MOMENTI_LIMITE[j].id === m.id ? 'true' : 'false'));
      el('btn-limite').disabled = false;
    });
    li.appendChild(b);
    lista.appendChild(li);
  });

  el('btn-limite').disabled = true;
  el('btn-limite').textContent = 'Conferma';
  el('btn-limite').onclick = async () => {
    if (!scelto) return;
    el('btn-limite').disabled = true;
    el('btn-limite').textContent = 'Un attimo…';
    if (!(await salva('limite', scelto))) {
      el('btn-limite').disabled = false;
      el('btn-limite').textContent = 'Riprova';
      return;
    }
    fase = 'debrief';
    mostraDebrief();
  };

  mostra('schermo-limite');
}

// ---------- fase 3: cosa faresti ----------

let azioniScelte = [];

function mostraDebrief() {
  el('domanda-debrief').textContent = DOMANDA_DEBRIEF;
  el('nota-debrief').textContent = NOTA_DEBRIEF;
  azioniScelte = [];

  const lista = el('lista-azioni');
  lista.innerHTML = '';
  AZIONI_DEBRIEF.forEach((a) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'azione';
    b.setAttribute('aria-pressed', 'false');

    const c = document.createElement('span');
    c.className = 'casella';
    c.textContent = '\u2713';
    c.setAttribute('aria-hidden', 'true');
    const t = document.createElement('span');
    t.textContent = a.etichetta;

    b.append(c, t);
    b.addEventListener('click', () => {
      const i = azioniScelte.indexOf(a.id);
      if (i === -1) azioniScelte.push(a.id); else azioniScelte.splice(i, 1);
      b.setAttribute('aria-pressed', azioniScelte.includes(a.id) ? 'true' : 'false');
      el('btn-debrief').disabled = azioniScelte.length === 0;
    });
    li.appendChild(b);
    lista.appendChild(li);
  });

  el('btn-debrief').disabled = true;
  el('btn-debrief').textContent = 'Conferma';
  el('btn-debrief').onclick = async () => {
    if (!azioniScelte.length) return;
    el('btn-debrief').disabled = true;
    el('btn-debrief').textContent = 'Un attimo…';
    if (!(await salva('debrief', azioniScelte.join(',')))) {
      el('btn-debrief').disabled = false;
      el('btn-debrief').textContent = 'Riprova';
      return;
    }
    await salva('completato', '1');
    if (!demo) {
      await supabase.from('attivita_partecipanti')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', partecipante.id);
    }
    fase = 'completato';
    mostraFinale();
  };

  mostra('schermo-debrief');
}

// ---------- riscontro + finale ----------

function mostraFinale() {
  const box = el('riscontro');
  box.innerHTML = '';

  const selezionate = AZIONI_DEBRIEF.filter((a) => azioniScelte.includes(a.id));
  const daMostrare = selezionate.length ? selezionate : AZIONI_DEBRIEF.filter((a) => a.categoria === 'protettiva');

  daMostrare.forEach((a) => {
    const riga = document.createElement('div');
    riga.className = 'riga-riscontro';
    const t = document.createElement('span');
    t.className = 'titolo';
    t.textContent = a.etichetta;
    const tag = document.createElement('span');
    tag.className = 'tag-cat ' + a.categoria;
    tag.textContent = ETICHETTE_CATEGORIA[a.categoria];
    t.appendChild(tag);
    const c = document.createElement('span');
    c.className = 'commento';
    c.textContent = COMMENTI_DEBRIEF[a.categoria];
    riga.append(t, c);
    box.appendChild(riga);
  });

  const fin = el('testo-finale');
  fin.innerHTML = '';
  TESTO_FINALE.forEach((riga) => {
    const p = document.createElement('p');
    p.textContent = riga;
    fin.appendChild(p);
  });

  mostra('schermo-finale');
}

// ---------- error handling ----------

window.addEventListener('unhandledrejection', () => {
  if (!el('schermo-stato').classList.contains('nascosto')) {
    messaggio('Connessione persa', 'Sto provando a riconnettermi. Se non succede nulla, ricarica la pagina.', true);
  }
});

avvia();
