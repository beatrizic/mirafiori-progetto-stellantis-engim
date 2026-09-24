import { supabase } from './supabase-client.js';
import { QUESITI, FASCE_RETRIBUZIONE, PROFILO_RETRIBUZIONE, TESTO_CONCLUSIONE } from './stereotipi-dati.js';
import { generaCodiceSessione, aggregaRisposte, aggregaRetribuzione } from './stereotipi-logica.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_stereotipi';
const URL_STUDENTE = new URL('gioco-stereotipi.html', window.location.href).href;

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;

// ---------- utilità ----------

function statoLeggibile(s) {
  return { waiting: 'In attesa', running: 'In corso', locked: 'Risposte chiuse', completed: 'Terminata' }[s] || s;
}

function abilitaControlli() {
  const attiva = !!sessione;
  ['btn-avvia', 'btn-qr', 'btn-blocca', 'btn-rivela', 'btn-retribuzione', 'btn-termina', 'btn-reset', 'btn-conclusione']
    .forEach((id) => { const b = el(id); if (b) b.disabled = !attiva; });
  el('btn-crea').disabled = attiva;

  if (!attiva) return;
  el('btn-avvia').disabled = sessione.stato !== 'waiting';
  el('btn-blocca').disabled = sessione.stato !== 'running';
  el('btn-rivela').textContent = sessione.risultati_visibili ? 'Nascondi risultati' : 'Rivela risultati';
  el('btn-conclusione').textContent = sessione.conclusione_visibile ? 'Nascondi conclusione' : 'Rivela conclusione';
  el('btn-retribuzione').disabled = sessione.fase === 'retribuzione';
}

async function aggiornaSessione(campi) {
  const { data, error } = await supabase
    .from('attivita_sessioni').update(campi).eq('id', sessione.id).select().single();
  if (!error) { sessione = data; renderTestata(); }
}

// ---------- ciclo di vita sessione ----------

async function creaSessione() {
  const codice = generaCodiceSessione();
  const { data, error } = await supabase
    .from('attivita_sessioni')
    .insert({ codice, activity_key: 'gender-stereotypes', stato: 'waiting' })
    .select().single();

  if (error) { alert('Non sono riuscita a creare la sessione. Riprova.'); return; }
  sessione = data;
  localStorage.setItem(CHIAVE_SESSIONE, sessione.id);
  qrDisegnato = false;
  avviaRealtime();
  renderTestata();
  disegnaQr();
  await aggiornaDashboard();
}

async function riprendiSessione() {
  const id = localStorage.getItem(CHIAVE_SESSIONE);
  if (!id) { abilitaControlli(); return; }
  const { data } = await supabase.from('attivita_sessioni').select('*').eq('id', id).maybeSingle();
  if (!data || data.stato === 'completed') { localStorage.removeItem(CHIAVE_SESSIONE); abilitaControlli(); return; }
  sessione = data;
  avviaRealtime();
  renderTestata();
  disegnaQr();
  await aggiornaDashboard();
}

function avviaRealtime() {
  if (canale) supabase.removeChannel(canale);
  canale = supabase
    .channel('regia-stereotipi-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_retribuzione', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .subscribe((stato) => {
      el('stato-realtime').textContent = stato === 'SUBSCRIBED' ? 'collegata' : 'riconnessione…';
      // Riconnessione automatica in caso di caduta del canale.
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

// ---------- testata, QR ----------

function renderTestata() {
  if (!sessione) return;
  el('blocco-sessione').classList.remove('nascosto');
  el('codice-sessione').textContent = sessione.codice;
  el('stato-sessione').textContent = statoLeggibile(sessione.stato);
  el('pannello-risultati').classList.toggle('proiezione', sessione.risultati_visibili);
  el('blocco-conclusione').classList.toggle('nascosto', !sessione.conclusione_visibile);
  abilitaControlli();
}

function disegnaQr() {
  if (qrDisegnato || !sessione) return;
  const contenitore = el('qr-attivita');
  contenitore.innerHTML = '';
  // Nessun token amministrativo nel QR: solo il codice pubblico di sessione.
  const url = `${URL_STUDENTE}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(contenitore, { text: url, width: 240, height: 240, colorDark: '#0e2a52', colorLight: '#ffffff' });
  el('url-studente').textContent = url;
  qrDisegnato = true;
}

// ---------- dashboard ----------

async function aggiornaDashboard() {
  if (!sessione) return;

  const [{ data: partecipanti }, { data: risposte }, { data: retribuzioni }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at, variante').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte').select('domanda_id, opzione_id, partecipante_id').eq('sessione_id', sessione.id),
    supabase.from('attivita_retribuzione').select('variante, fascia').eq('sessione_id', sessione.id)
  ]);

  const p = partecipanti || [], r = risposte || [], rt = retribuzioni || [];
  const iniziati = new Set(r.map((x) => x.partecipante_id)).size;

  el('n-collegati').textContent = p.length;
  el('n-iniziati').textContent = iniziati;
  el('n-completati').textContent = p.filter((x) => x.completed_at).length;
  el('n-risposte').textContent = r.length;

  renderQuesiti(r);
  renderRetribuzione(rt);
}

function renderQuesiti(risposte) {
  const griglia = el('griglia-quesiti');
  griglia.innerHTML = '';

  QUESITI.forEach((q, i) => {
    const risposteQ = risposte.filter((x) => x.domanda_id === q.id);
    const dati = aggregaRisposte(q.professioni, risposteQ);

    const card = document.createElement('article');
    card.className = 'card-quesito';

    const testata = document.createElement('div');
    testata.className = 'testata-quesito';
    const img = document.createElement('img');
    img.src = q.ritratto; img.alt = q.alt; img.className = 'mini-ritratto';
    img.onerror = () => { img.replaceWith(Object.assign(document.createElement('div'), { className: 'mini-ritratto vuoto' })); };
    const meta = document.createElement('div');
    const titolo = document.createElement('h3');
    titolo.textContent = `Quesito ${i + 1}`;
    const conteggio = document.createElement('p');
    conteggio.className = 'grigio';
    conteggio.textContent = `${risposteQ.length} risposte`;
    meta.append(titolo, conteggio);
    testata.append(img, meta);

    const barre = document.createElement('div');
    dati.forEach((d, idx) => {
      const riga = document.createElement('div');
      riga.className = 'barra-riga';
      const etichetta = document.createElement('div');
      etichetta.className = 'barra-etichetta';
      const nome = document.createElement('span');
      nome.textContent = d.label;
      if (idx === 0 && d.conteggio > 0) nome.classList.add('primo');
      const val = document.createElement('span');
      val.textContent = `${d.percentuale}% (${d.conteggio})`;
      etichetta.append(nome, val);
      const traccia = document.createElement('div');
      traccia.className = 'barra-traccia';
      const fill = document.createElement('div');
      fill.className = 'barra-fill';
      fill.style.width = d.percentuale + '%';
      traccia.appendChild(fill);
      riga.append(etichetta, traccia);
      barre.appendChild(riga);
    });

    card.append(testata, barre);
    griglia.appendChild(card);
  });
}

function renderRetribuzione(retribuzioni) {
  const blocco = el('blocco-retribuzione');
  if (!retribuzioni.length) { blocco.classList.add('nascosto'); return; }
  blocco.classList.remove('nascosto');

  ['A', 'B'].forEach((v) => {
    const dati = aggregaRetribuzione(FASCE_RETRIBUZIONE, retribuzioni.filter((x) => x.variante === v));
    const box = el('retr-' + v);
    box.innerHTML = '';

    const h = document.createElement('h3');
    h.textContent = PROFILO_RETRIBUZIONE[v].nome;
    const sub = document.createElement('p');
    sub.className = 'grigio';
    sub.textContent = `${dati.totale} risposte`;
    box.append(h, sub);

    dati.distribuzione.forEach((d) => {
      const riga = document.createElement('div');
      riga.className = 'barra-riga';
      const etichetta = document.createElement('div');
      etichetta.className = 'barra-etichetta';
      const nome = document.createElement('span'); nome.textContent = d.label;
      const val = document.createElement('span'); val.textContent = `${d.percentuale}% (${d.conteggio})`;
      etichetta.append(nome, val);
      const traccia = document.createElement('div'); traccia.className = 'barra-traccia';
      const fill = document.createElement('div'); fill.className = 'barra-fill';
      fill.style.width = d.percentuale + '%';
      traccia.appendChild(fill);
      riga.append(etichetta, traccia);
      box.appendChild(riga);
    });

    const sintesi = document.createElement('p');
    sintesi.className = 'sintesi';
    sintesi.textContent = dati.totale
      ? `Fascia più scelta: ${dati.fasciaPiuScelta} · Mediana indicativa: ${dati.medianaValore} €`
      : 'Nessuna risposta.';
    box.appendChild(sintesi);
  });
}

// ---------- controlli ----------

el('btn-crea').addEventListener('click', creaSessione);
el('btn-avvia').addEventListener('click', () => aggiornaSessione({ stato: 'running', started_at: new Date().toISOString() }));
el('btn-blocca').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-rivela').addEventListener('click', () => aggiornaSessione({ risultati_visibili: !sessione.risultati_visibili }));
el('btn-conclusione').addEventListener('click', () => aggiornaSessione({ conclusione_visibile: !sessione.conclusione_visibile }));
el('btn-retribuzione').addEventListener('click', () => aggiornaSessione({ fase: 'retribuzione', stato: 'running' }));
el('btn-qr').addEventListener('click', () => {
  const b = el('blocco-qr');
  const nascosto = b.classList.toggle('nascosto');
  el('btn-qr').textContent = nascosto ? 'Mostra QR' : 'Nascondi QR';
});

el('btn-termina').addEventListener('click', async () => {
  if (!confirm('Terminare la sessione? Gli studenti non potranno più rispondere.')) return;
  await aggiornaSessione({ stato: 'completed', ended_at: new Date().toISOString() });
});

el('btn-reset').addEventListener('click', async () => {
  if (!confirm('Cancellare definitivamente tutti i dati di questa sessione? L\u2019operazione non è reversibile.')) return;
  // ON DELETE CASCADE rimuove partecipanti, risposte e retribuzioni.
  await supabase.from('attivita_sessioni').delete().eq('id', sessione.id);
  localStorage.removeItem(CHIAVE_SESSIONE);
  if (canale) supabase.removeChannel(canale);
  sessione = null; qrDisegnato = false;
  el('blocco-sessione').classList.add('nascosto');
  el('blocco-retribuzione').classList.add('nascosto');
  el('griglia-quesiti').innerHTML = '';
  abilitaControlli();
});

// ---------- conclusione didattica ----------

(function renderConclusione() {
  const box = el('testo-conclusione');
  TESTO_CONCLUSIONE.forEach((riga) => {
    const p = document.createElement('p');
    p.textContent = riga;
    box.appendChild(p);
  });
})();

riprendiSessione();
