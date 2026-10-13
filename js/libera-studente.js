import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, ACCOUNT, FASI, INDICE_MURO, TONI, riconosciTono, SEGNALE_ALLARME, normalizza,
  PRIMO_MESSAGGIO, TESTO_FINALE, TESTO_AIUTO, TESTO_PAUSA
} from './libera-dati.js';
import { generaAnonymousId } from './attivita-logica.js';

// ============================================================
//  PRIVACY — scelta deliberata
//  Quello che lo studente scrive NON viene mai salvato né inviato.
//  Resta solo nel suo telefono. Al database arrivano unicamente
//  numeri aggregati: quanti scambi ha fatto e quante volte ha
//  reagito in ciascun modo. Nessun testo libero, mai.
//
//  DURATA — la conversazione non si chiude da sola: va avanti
//  finché lo studente preme "Basta". Dopo l'ultima fase resta al
//  massimo dell'intensità pescando dal blocco "muro".
// ============================================================

const CHIAVE_ANON = 'mirafiori_anon_id';
// ?demo=1 → anteprima per il docente: la chat funziona identica, ma senza
// sessione, senza database e senza salvare nulla. Serve a guardarla prima
// di portarla in aula.
const DEMO = new URLSearchParams(location.search).get('demo') === '1';
const el = (id) => document.getElementById(id);
const motoRidotto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const attendi = (ms) => new Promise((r) => setTimeout(r, motoRidotto() ? Math.min(ms, 120) : ms));

let sessione = null;
let partecipante = null;
let fase = 0;
let scambi = 0;
let chiusa = false;
let inAttesa = false;
let pausaMostrata = false;        // la pausa di sicurezza compare una volta sola
const usate = {};                 // alternative già usate, per cella fase×tono
const conteggi = Object.fromEntries(TONI.map((t) => [t, 0]));
let ultimaRisposta = null;        // serve per i "seguiti": cosa ha appena detto l'aggressore

function mostra(id) {
  ['schermo-stato', 'schermo-chat', 'schermo-fine'].forEach((x) => el(x).classList.add('nascosto'));
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

// ---------- avvio ----------

async function avvia() {
  if (DEMO) { preparaTestata(); mostra('schermo-chat'); apertura(); return; }

  const codice = new URLSearchParams(location.search).get('s');
  if (!codice) { messaggio('Link non valido', 'Inquadra di nuovo il QR code mostrato in aula.', true); return; }

  const { data, error } = await supabase
    .from('attivita_sessioni').select('*')
    .eq('codice', codice.toUpperCase()).eq('activity_key', ACTIVITY_KEY).maybeSingle();

  if (error || !data) { messaggio('Sessione non trovata', 'Controlla di aver inquadrato il QR code giusto.', true); return; }

  sessione = data;
  await sincronizza();

  supabase.channel('sessione-libera-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; if (!chiusa) await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  if (sessione.stato === 'waiting')   { messaggio('Quasi pronti', 'La simulazione non è ancora iniziata.'); return; }
  if (sessione.stato === 'completed') { messaggio('Sessione terminata', 'Questa attività è terminata.'); return; }
  if (sessione.stato === 'locked')    { messaggio('Chiuso', 'Il docente ha chiuso la simulazione.'); return; }

  if (!partecipante && !(await registraPartecipante())) return;
  if (el('messaggi').childElementCount) return;   // già in corso, non ricominciare

  preparaTestata();
  mostra('schermo-chat');
  apertura();
}

async function registraPartecipante() {
  const anonymous = anonId();
  const { data: esistente } = await supabase
    .from('attivita_partecipanti').select('*')
    .eq('sessione_id', sessione.id).eq('anonymous_id', anonymous).maybeSingle();

  if (esistente) { partecipante = esistente; return true; }

  const { data, error } = await supabase
    .from('attivita_partecipanti')
    .insert({ sessione_id: sessione.id, anonymous_id: anonymous })
    .select().single();

  if (error) { messaggio('Connessione non riuscita', 'Prova a ricaricare la pagina.', true); return false; }
  partecipante = data;
  return true;
}

// ---------- salvataggio: solo numeri aggregati ----------

async function salvaContatore(tipo, valore) {
  if (DEMO || !partecipante) return;
  await supabase.from('attivita_risposte_generiche').upsert({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    activity_key: ACTIVITY_KEY,
    scenario_id: 'libera',
    tipo,
    valore: String(valore)
  }, { onConflict: 'sessione_id,partecipante_id,scenario_id,tipo' });
}

// ---------- chat ----------

function preparaTestata() {
  el('avatar').textContent = ACCOUNT.iniziali;
  el('avatar').style.background = ACCOUNT.colore;
  el('chat-username').textContent = ACCOUNT.username;
}

const scrollGiu = () => { const c = el('messaggi'); c.scrollTop = c.scrollHeight; };

function bolla(testo, mia) {
  const d = document.createElement('div');
  d.className = 'bolla ' + (mia ? 'inviata' : 'ricevuta');
  d.textContent = testo;
  el('messaggi').appendChild(d);
  scrollGiu();
}

function evento(testo, riquadro) {
  const d = document.createElement('div');
  d.className = 'evento' + (riquadro ? ' riquadro' : '');
  d.textContent = testo;
  el('messaggi').appendChild(d);
  scrollGiu();
}

/** "Visualizzato" sotto il messaggio dello studente: letto e ignorato. */
function visualizzato() {
  const d = document.createElement('div');
  d.className = 'visualizzato';
  d.textContent = 'Visualizzato';
  el('messaggi').appendChild(d);
  scrollGiu();
}

async function scrivendo(ms) {
  const d = document.createElement('div');
  d.className = 'scrivendo';
  d.setAttribute('aria-label', 'Sta scrivendo');
  d.innerHTML = '<span></span><span></span><span></span>';
  el('messaggi').appendChild(d);
  scrollGiu();
  await attendi(ms);
  d.remove();
}

function abilita(stato) {
  el('campo').disabled = !stato;
  el('btn-invia').disabled = !stato;
  if (stato) el('campo').focus();
}

async function apertura() {
  abilita(false);
  await attendi(500);
  await scrivendo(700 + Math.random() * 500);
  bolla(PRIMO_MESSAGGIO, false);
  abilita(true);
}

/**
 * La risposta è scelta da UNA sola cella: fase corrente × tono di quello
 * che lo studente ha appena scritto. Per questo risponde nel merito invece
 * di dire una cosa qualsiasi. Oltre l'ultima fase si resta sul "muro".
 * Dentro la cella non si ripete un'alternativa finché non sono finite.
 */
function rispostaPer(tono, testoStudente) {
  const f = FASI[Math.min(fase, INDICE_MURO)];
  const cella = f.risposte[tono] || f.risposte.altro;
  const chiave = f.id + ':' + tono;
  usate[chiave] = usate[chiave] || [];

  let libere = cella.filter((_, i) => !usate[chiave].includes(i));
  if (!libere.length) { usate[chiave] = []; libere = cella; }

  // Mai ripetere a pappagallo quello che ha appena scritto lo studente:
  // "E quindi?" a cui si risponde "e quindi?" fa crollare la finzione.
  const eco = normalizza(testoStudente);
  if (eco) {
    const diverse = libere.filter((alt) => normalizza(testoDi(alt)) !== eco);
    if (diverse.length) libere = diverse;
  }

  const scelta = libere[Math.floor(Math.random() * libere.length)];
  usate[chiave].push(cella.indexOf(scelta));
  return scelta;
}

/** Il testo della bolla, sia che la risposta sia una stringa sia un oggetto. */
const testoDi = (r) => (typeof r === 'string' ? r : r.testo);

/**
 * Se l'ultima battuta aveva lanciato un gancio ("hanno aperto un sondaggio")
 * e lo studente ci risponde ("cosa vinco?"), si resta su quel gancio.
 * Unica eccezione: se chiede di smettere, si risponde a quello.
 */
function seguitoPer(tono, testoStudente) {
  if (!ultimaRisposta || !ultimaRisposta.seguiti || tono === 'stop') return null;
  const t = normalizza(testoStudente);
  return ultimaRisposta.seguiti.find((s) => s.se.test(t)) || null;
}

async function emetti(tono, testoStudente) {
  // Dopo un insulto l'aggressore a volte legge e non risponde subito:
  // il silenzio è più efficace di una replica.
  if (tono === 'insulto' && Math.random() < 0.25) {
    await attendi(900); visualizzato(); await attendi(1300);
  }

  // UNA sola bolla per turno: è la regola del botta e risposta.
  // L'eventuale notifica grigia non è un messaggio, è l'app che avvisa.
  const risposta = seguitoPer(tono, testoStudente) || rispostaPer(tono, testoStudente);
  ultimaRisposta = typeof risposta === 'string' ? null : risposta;
  await scrivendo(650 + Math.random() * 700);
  bolla(testoDi(risposta), false);
  if (risposta.sistema) { await attendi(500); evento(risposta.sistema, true); }

  if (fase < INDICE_MURO) fase++;
  scambi++;
  if (conteggi[tono] !== undefined) conteggi[tono]++;

  // Aggiornamento live della dashboard: solo numeri.
  salvaContatore('scambi', scambi);
  if (conteggi[tono] !== undefined) salvaContatore('tono_' + tono, conteggi[tono]);
}

async function rispondi(testoStudente) {
  const tono = riconosciTono(testoStudente);
  await emetti(tono, testoStudente);
  abilita(true);

  // La pausa di sicurezza arriva DOPO la risposta e non chiude niente:
  // decide lo studente se continuare.
  if (!pausaMostrata && SEGNALE_ALLARME.test(normalizza(testoStudente))) mostraPausa();
}

// ---------- pausa di sicurezza (non interrompe: mette in pausa) ----------

function mostraPausa() {
  pausaMostrata = true;
  abilita(false);
  el('pausa-titolo').textContent = TESTO_PAUSA.titolo;
  const box = el('pausa-testo');
  box.innerHTML = '';
  TESTO_PAUSA.righe.forEach((r) => { const p = document.createElement('p'); p.textContent = r; box.appendChild(p); });
  el('pausa-aiuto').textContent = TESTO_PAUSA.aiuto;
  el('btn-continua-pausa').textContent = TESTO_PAUSA.continua;
  el('btn-esci-pausa').textContent = TESTO_PAUSA.esci;
  el('velo-pausa').classList.remove('nascosto');
  el('btn-continua-pausa').focus();
  salvaContatore('pausa_sicurezza', '1');
}

el('btn-continua-pausa').addEventListener('click', () => {
  el('velo-pausa').classList.add('nascosto');
  if (!chiusa) abilita(true);
});

// ---------- chiusura, decisa dallo studente ----------

async function chiudi() {
  if (chiusa) return;
  chiusa = true;
  abilita(false);
  el('velo-pausa').classList.add('nascosto');
  el('messaggi').classList.add('sfumata');
  await attendi(400);

  const box = el('testo-fine');
  box.innerHTML = '';
  TESTO_FINALE.forEach((r) => { const p = document.createElement('p'); p.textContent = r; box.appendChild(p); });
  el('riquadro-aiuto').textContent = TESTO_AIUTO;

  await salvaContatore('completato', '1');
  await salvaContatore('scambi_finali', scambi);
  if (!DEMO && partecipante) {
    await supabase.from('attivita_partecipanti')
      .update({ completed_at: new Date().toISOString() }).eq('id', partecipante.id);
  }

  mostra('schermo-fine');
}

el('btn-basta').addEventListener('click', () => {
  if (confirm('Vuoi chiudere la conversazione?')) chiudi();
});

// ---------- invio ----------

el('form-invio').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (chiusa || inAttesa) return;
  const t = el('campo').value.trim();
  if (!t) return;

  inAttesa = true;
  bolla(t, true);
  el('campo').value = '';
  el('campo').style.height = 'auto';
  abilita(false);
  await rispondi(t);
  inAttesa = false;
});

el('campo').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 110) + 'px';
});

el('campo').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el('form-invio').requestSubmit(); }
});

el('esci').addEventListener('click', (e) => {
  if (!confirm('Vuoi uscire e tornare alla home?')) e.preventDefault();
});

window.addEventListener('unhandledrejection', () => {
  if (!el('schermo-stato').classList.contains('nascosto')) {
    messaggio('Connessione persa', 'Controlla la rete e ricarica la pagina.', true);
  }
});

avvia();
