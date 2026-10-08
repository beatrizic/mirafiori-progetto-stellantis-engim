import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, ACCOUNT, MAX_SCAMBI, FASI, REAZIONI, SEGNALI, SEGNALE_ALLARME,
  PRIMO_MESSAGGIO, TESTO_FINALE, TESTO_AIUTO, TESTO_ALLARME
} from './libera-dati.js';
import { generaAnonymousId } from './attivita-logica.js';

// ============================================================
//  PRIVACY — scelta deliberata
//  Quello che lo studente scrive NON viene mai salvato né inviato.
//  Resta solo nel suo telefono. Al database arrivano unicamente
//  numeri aggregati: quanti scambi ha fatto e quante volte ha
//  reagito in ciascun modo. Nessun testo libero, mai.
// ============================================================

const CHIAVE_ANON = 'mirafiori_anon_id';
const el = (id) => document.getElementById(id);
const motoRidotto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const attendi = (ms) => new Promise((r) => setTimeout(r, motoRidotto() ? Math.min(ms, 120) : ms));

let sessione = null;
let partecipante = null;
let fase = 0;
let scambi = 0;
let chiusa = false;
let inAttesa = false;
let ultimaReazione = '';
const usate = {};
const conteggi = { insulto: 0, stop: 0, chiedere: 0, difesa: 0, altro: 0 };

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
  if (!partecipante) return;
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
  for (const t of PRIMO_MESSAGGIO) {
    await scrivendo(700 + Math.random() * 500);
    bolla(t, false);
    await attendi(300);
  }
  abilita(true);
}

/** Battuta non ancora usata della fase corrente. */
function battutaDiFase() {
  const f = FASI[Math.min(fase, FASI.length - 1)];
  usate[f.id] = usate[f.id] || [];
  let libere = f.battute.filter((_, i) => !usate[f.id].includes(i));
  if (!libere.length) { usate[f.id] = []; libere = f.battute; }
  const scelta = libere[Math.floor(Math.random() * libere.length)];
  usate[f.id].push(f.battute.indexOf(scelta));
  return scelta;
}

function riconosciTono(testo) {
  const t = (testo || '').trim();
  if (!t) return 'silenzio';
  if (SEGNALI.chiedere.test(t)) return 'chiedere';
  if (SEGNALI.insulto.test(t)) return 'insulto';
  if (SEGNALI.stop.test(t)) return 'stop';
  if (SEGNALI.difesa.test(t)) return 'difesa';
  return 'altro';
}

function pescaDiversa(lista) {
  const libere = lista.filter((x) => x !== ultimaReazione);
  const scelta = libere[Math.floor(Math.random() * libere.length)];
  ultimaReazione = scelta;
  return scelta;
}

async function rispondi(testoStudente) {
  // Priorità assoluta: se emerge disagio reale, si esce dalla simulazione.
  if (SEGNALE_ALLARME.test(testoStudente)) { await interrompiPerSicurezza(); return; }

  const tono = riconosciTono(testoStudente);
  if (conteggi[tono] !== undefined) conteggi[tono]++;

  const repliche = REAZIONI[tono];
  if (repliche) {
    await scrivendo(600 + Math.random() * 500);
    bolla(pescaDiversa(repliche), false);
    await attendi(400);
  }

  for (const pezzo of battutaDiFase()) {
    if (typeof pezzo === 'string') {
      await scrivendo(700 + Math.random() * 700);
      bolla(pezzo, false);
    } else if (pezzo.sistema) {
      await attendi(700); evento(pezzo.sistema, true);
    } else if (pezzo.evento) {
      await attendi(600); evento(pezzo.evento, false);
    }
  }

  fase++;
  scambi++;

  // Aggiornamento live della dashboard: solo numeri.
  salvaContatore('scambi', scambi);
  if (conteggi[tono] !== undefined) salvaContatore('tono_' + tono, conteggi[tono]);

  if (scambi >= MAX_SCAMBI) { await attendi(700); await chiudi(); return; }
  abilita(true);
}

async function chiudi() {
  chiusa = true;
  abilita(false);
  el('messaggi').classList.add('sfumata');
  await attendi(500);

  const box = el('testo-fine');
  box.innerHTML = '';
  TESTO_FINALE.forEach((r) => { const p = document.createElement('p'); p.textContent = r; box.appendChild(p); });
  el('riquadro-aiuto').textContent = TESTO_AIUTO;

  await salvaContatore('completato', '1');
  await supabase.from('attivita_partecipanti')
    .update({ completed_at: new Date().toISOString() }).eq('id', partecipante.id);

  mostra('schermo-fine');
}

async function interrompiPerSicurezza() {
  chiusa = true;
  abilita(false);
  el('titolo-fine').textContent = 'Fermiamoci un attimo';
  const box = el('testo-fine');
  box.innerHTML = '';
  TESTO_ALLARME.forEach((r) => { const p = document.createElement('p'); p.textContent = r; box.appendChild(p); });
  el('riquadro-aiuto').innerHTML =
    '<strong>Telefono Azzurro 19696</strong> — gratuito, anonimo, attivo tutti i giorni.<br>' +
    'Puoi anche parlarne subito con il docente che è in aula con te.';
  // Al docente arriva solo il segnale, mai il testo.
  await salvaContatore('interrotta', '1');
  mostra('schermo-fine');
}

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
