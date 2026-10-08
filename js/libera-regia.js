import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, ETICHETTE_TONO, MAX_SCAMBI } from './libera-dati.js';
import { generaCodiceSessione } from './attivita-logica.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_libera';
const PAGINA_STUDENTE = 'gioco-libera.html';

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;

const statoLeggibile = (s) =>
  ({ waiting: 'In attesa', running: 'In corso', locked: 'Chiusa', completed: 'Terminata' }[s] || s);

function abilitaControlli() {
  const attiva = !!sessione;
  ['btn-avvia-l', 'btn-qr-l', 'btn-blocca-l', 'btn-termina-l', 'btn-reset-l']
    .forEach((id) => { const b = el(id); if (b) b.disabled = !attiva; });
  el('btn-crea-l').disabled = attiva;
  if (!attiva) return;
  el('btn-avvia-l').disabled = sessione.stato !== 'waiting';
  el('btn-blocca-l').disabled = sessione.stato !== 'running';
}

async function aggiornaSessione(campi) {
  const { data, error } = await supabase
    .from('attivita_sessioni').update(campi).eq('id', sessione.id).select().single();
  if (!error) { sessione = data; renderTestata(); }
}

// ---------- ciclo di vita ----------

async function creaSessione() {
  el('btn-crea-l').disabled = true;
  const { data, error } = await supabase
    .from('attivita_sessioni')
    .insert({ codice: generaCodiceSessione(), activity_key: ACTIVITY_KEY, stato: 'waiting' })
    .select().single();
  el('btn-crea-l').disabled = false;
  if (error) {
    console.error('Creazione sessione fallita:', error);
    alert('Non sono riuscita a creare la sessione.\n\nErrore: ' + (error.message || '-') + '\nCodice: ' + (error.code || '-'));
    return;
  }
  sessione = data;
  localStorage.setItem(CHIAVE_SESSIONE, sessione.id);
  qrDisegnato = false;
  avviaRealtime(); renderTestata(); disegnaQr(); aggiornaDashboard();
}

async function riprendiSessione() {
  const id = localStorage.getItem(CHIAVE_SESSIONE);
  if (!id) { abilitaControlli(); return; }
  const { data } = await supabase.from('attivita_sessioni').select('*').eq('id', id).maybeSingle();
  if (!data || data.stato === 'completed' || data.activity_key !== ACTIVITY_KEY) {
    localStorage.removeItem(CHIAVE_SESSIONE); abilitaControlli(); return;
  }
  sessione = data;
  avviaRealtime(); renderTestata(); disegnaQr(); aggiornaDashboard();
}

function avviaRealtime() {
  if (canale) supabase.removeChannel(canale);
  canale = supabase.channel('regia-libera-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte_generiche', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .subscribe((stato) => {
      el('stato-realtime-l').textContent = stato === 'SUBSCRIBED' ? 'collegata' : 'riconnessione…';
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

function renderTestata() {
  if (!sessione) return;
  el('blocco-sessione-l').classList.remove('nascosto');
  el('codice-sessione-l').textContent = sessione.codice;
  el('stato-sessione-l').textContent = statoLeggibile(sessione.stato);
  abilitaControlli();
}

function disegnaQr() {
  if (qrDisegnato || !sessione) return;
  const c = el('qr-libera');
  c.innerHTML = '';
  const url = `${new URL(PAGINA_STUDENTE, window.location.href).href}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(c, { text: url, width: 220, height: 220, colorDark: '#0e2a52', colorLight: '#ffffff' });
  const locale = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  el('url-studente-l').textContent = url + (locale ? '  ⚠ anteprima locale: questo QR non funziona dai telefoni' : '');
  qrDisegnato = true;
}

// ---------- dashboard ----------

function barra(etichetta, percentuale, conteggio, classe) {
  const riga = document.createElement('div');
  riga.className = 'barra-riga';
  const lab = document.createElement('div');
  lab.className = 'barra-etichetta';
  const n = document.createElement('span'); n.textContent = etichetta;
  const v = document.createElement('span'); v.className = 'barra-valore'; v.textContent = `${percentuale}% (${conteggio})`;
  lab.append(n, v);
  const traccia = document.createElement('div');
  traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill' + (classe ? ' ' + classe : '');
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);
  riga.append(lab, traccia);
  return riga;
}

async function aggiornaDashboard() {
  if (!sessione) return;

  const [{ data: partecipanti }, { data: righe }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte_generiche').select('partecipante_id, tipo, valore').eq('sessione_id', sessione.id)
  ]);

  const p = partecipanti || [];
  const r = righe || [];
  const num = (x) => parseInt(x, 10) || 0;

  const scambiPer = r.filter((x) => x.tipo === 'scambi');
  const attivi = new Set(scambiPer.map((x) => x.partecipante_id)).size;
  const completati = p.filter((x) => x.completed_at).length;
  const totScambi = scambiPer.reduce((a, x) => a + num(x.valore), 0);
  const interrotte = r.filter((x) => x.tipo === 'interrotta').length;

  el('ln-collegati').textContent = p.length;
  el('ln-attivi').textContent = attivi;
  el('ln-completati').textContent = completati;
  el('ln-messaggi').textContent = totScambi;
  el('ln-media').textContent = attivi ? (totScambi / attivi).toFixed(1) : '—';

  // Come ha reagito la classe: somma dei contatori per tono.
  const toni = ['insulto', 'stop', 'chiedere', 'difesa', 'altro'];
  const somme = {};
  toni.forEach((t) => {
    somme[t] = r.filter((x) => x.tipo === 'tono_' + t).reduce((a, x) => a + num(x.valore), 0);
  });
  const totale = toni.reduce((a, t) => a + somme[t], 0);

  const box = el('toni-libera');
  box.innerHTML = '';
  if (!totale) {
    const vuoto = document.createElement('p');
    vuoto.className = 'grigio';
    vuoto.textContent = 'Nessun messaggio ancora.';
    box.appendChild(vuoto);
  } else {
    const classi = { insulto: 'cat-escalation', stop: 'cat-protettiva', chiedere: '', difesa: 'cat-chiedere_aiuto', altro: 'cat-passiva' };
    toni.map((t) => ({ t, n: somme[t] }))
      .sort((a, b) => b.n - a.n)
      .forEach(({ t, n }) => box.appendChild(
        barra(ETICHETTE_TONO[t], Math.round((n / totale) * 100), n, classi[t])));
  }

  // Avviso al docente: qualcuno ha scritto qualcosa che ha fatto scattare l'interruzione.
  const avviso = el('avviso-interrotte');
  if (interrotte > 0) {
    avviso.textContent = interrotte === 1
      ? 'Una simulazione si è interrotta da sola: uno studente ha scritto qualcosa che segnala disagio. Il testo non è stato registrato. Vale la pena guardarsi intorno in aula.'
      : `${interrotte} simulazioni si sono interrotte da sole: alcuni studenti hanno scritto qualcosa che segnala disagio. I testi non sono stati registrati. Vale la pena guardarsi intorno in aula.`;
    avviso.classList.remove('nascosto');
  } else {
    avviso.classList.add('nascosto');
  }
}

// ---------- controlli ----------

el('btn-crea-l').addEventListener('click', creaSessione);
el('btn-avvia-l').addEventListener('click', () => aggiornaSessione({ stato: 'running', started_at: new Date().toISOString() }));
el('btn-blocca-l').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-qr-l').addEventListener('click', () => {
  const nascosto = el('blocco-qr-l').classList.toggle('nascosto');
  el('btn-qr-l').textContent = nascosto ? 'Mostra QR' : 'Nascondi QR';
});
el('btn-termina-l').addEventListener('click', async () => {
  if (!confirm('Terminare la sessione? Gli studenti non potranno più scrivere.')) return;
  await aggiornaSessione({ stato: 'completed', ended_at: new Date().toISOString() });
  localStorage.removeItem(CHIAVE_SESSIONE);
});
el('btn-reset-l').addEventListener('click', async () => {
  if (!confirm('Cancellare definitivamente questa sessione e i suoi dati?')) return;
  await supabase.from('attivita_sessioni').delete().eq('id', sessione.id);
  localStorage.removeItem(CHIAVE_SESSIONE);
  if (canale) supabase.removeChannel(canale);
  sessione = null; qrDisegnato = false;
  el('blocco-sessione-l').classList.add('nascosto');
  abilitaControlli();
});

el('max-scambi').textContent = MAX_SCAMBI;
riprendiSessione();
