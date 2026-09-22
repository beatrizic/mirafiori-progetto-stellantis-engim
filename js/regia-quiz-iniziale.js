import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, CONTESTI, MOMENTI, DOMANDE, ACCETTAZIONE, domandePer } from './quiz-dati.js';
import { generaCodiceSessione } from './attivita-logica.js';
import { esplosioneParticelle } from './particelle.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_quiz';
const URL_STUDENTE = 'https://www.tobea.it/quiz-iniziale.html';

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;
let proiezione = false;
let esplosaGia = false;
let scelta = { contesto: 'engim', momento: 'iniziale' };

const statoLeggibile = (s) =>
  ({ waiting: 'In attesa', running: 'Aperto', locked: 'Chiuso', completed: 'Terminato' }[s] || s);

// ---------- configurazione ----------

function pulsantiScelta(contenitoreId, voci, chiave) {
  const cont = el(contenitoreId);
  cont.innerHTML = '';
  Object.values(voci).forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pulsante-scelta';
    b.textContent = v.etichetta;
    b.setAttribute('aria-pressed', scelta[chiave] === v.id ? 'true' : 'false');
    b.addEventListener('click', () => {
      scelta[chiave] = v.id;
      [...cont.children].forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      aggiornaRiepilogo();
    });
    cont.appendChild(b);
  });
}

function aggiornaRiepilogo() {
  const d = domandePer(scelta.contesto, scelta.momento);
  const conoscenza = d.filter((x) => x.corretta).length;
  el('riepilogo-domande').textContent =
    `${d.length} domande, di cui ${conoscenza} di conoscenza con risposta corretta, più il riquadro finale di accettazione.`;
}

// ---------- ciclo di vita ----------

async function creaSessione() {
  el('btn-crea').disabled = true;
  const { data, error } = await supabase
    .from('attivita_sessioni')
    .insert({
      codice: generaCodiceSessione(),
      activity_key: ACTIVITY_KEY,
      stato: 'waiting',
      contesto: scelta.contesto,
      momento: scelta.momento
    })
    .select().single();

  el('btn-crea').disabled = false;
  if (error) { alert('Non sono riuscita a creare la sessione. Riprova.'); return; }
  sessione = data;
  localStorage.setItem(CHIAVE_SESSIONE, sessione.id);
  apriSessione();
}

async function riprendiSessione() {
  const id = localStorage.getItem(CHIAVE_SESSIONE);
  if (!id) return;
  const { data } = await supabase.from('attivita_sessioni').select('*').eq('id', id).maybeSingle();
  if (!data || data.stato === 'completed' || data.activity_key !== ACTIVITY_KEY) {
    localStorage.removeItem(CHIAVE_SESSIONE);
    return;
  }
  sessione = data;
  apriSessione();
}

function apriSessione() {
  el('blocco-configura').classList.add('nascosto');
  el('blocco-sessione').classList.remove('nascosto');
  qrDisegnato = false;
  esplosaGia = false;
  avviaRealtime();
  renderTestata();
  disegnaQr();
  aggiornaRisultati();
}

function avviaRealtime() {
  if (canale) supabase.removeChannel(canale);
  canale = supabase.channel('regia-quiz-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte_generiche', filter: 'sessione_id=eq.' + sessione.id }, aggiornaRisultati)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaRisultati)
    .subscribe((stato) => {
      el('stato-realtime').textContent = stato === 'SUBSCRIBED' ? 'live' : 'riconnessione…';
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

async function aggiornaSessione(campi) {
  const { data, error } = await supabase
    .from('attivita_sessioni').update(campi).eq('id', sessione.id).select().single();
  if (!error) { sessione = data; renderTestata(); }
}

function renderTestata() {
  const contesto = CONTESTI[sessione.contesto]?.etichetta || '—';
  const momento = MOMENTI[sessione.momento]?.etichetta || '—';
  el('titolo-sessione').textContent = `Quiz ${momento.toLowerCase()}`;
  el('pillola-contesto').textContent = contesto;
  el('pillola-momento').textContent = momento;
  el('codice-sessione').textContent = sessione.codice;
  el('stato-sessione').textContent = statoLeggibile(sessione.stato);
  el('btn-apri').disabled = sessione.stato === 'running';
  el('btn-chiudi').disabled = sessione.stato !== 'running';
}

function disegnaQr() {
  if (qrDisegnato) return;
  const c = el('qr-quiz');
  c.innerHTML = '';
  const url = `${URL_STUDENTE}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(c, { text: url, width: 200, height: 200, colorDark: '#0e2a52', colorLight: '#ffffff' });
  el('url-studente').textContent = url;
  qrDisegnato = true;
}

// ---------- risultati della sessione ----------

function barra(testo, percentuale, conteggio, giusta, classeExtra = '') {
  const riga = document.createElement('div');
  riga.className = 'barra-riga';
  const lab = document.createElement('div');
  lab.className = 'barra-etichetta';
  const t = document.createElement('span');
  t.textContent = testo;
  if (giusta) t.classList.add('corretta');
  const v = document.createElement('span');
  v.textContent = `${percentuale}% (${conteggio})`;
  lab.append(t, v);
  const traccia = document.createElement('div');
  traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill' + (giusta ? ' giusta' : '') + (classeExtra ? ' ' + classeExtra : '');
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);
  riga.append(lab, traccia);
  return riga;
}

function cardDomanda(d, risposte, numero) {
  const righe = risposte.filter((r) => r.scenario_id === d.id);
  const totale = righe.length;
  const card = document.createElement('article');
  card.className = 'card' + (d.id === ACCETTAZIONE.id ? ' accettazione' : '');

  const h = document.createElement('h3');
  h.textContent = (numero ? numero + '. ' : '') + (d.id === ACCETTAZIONE.id ? 'Hanno letto il testo prima di accettare?' : d.testo);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.appendChild(document.createTextNode(`${totale} risposte`));
  if (d.corretta) {
    const b = document.createElement('span'); b.className = 'badge conoscenza'; b.textContent = 'conoscenza';
    meta.appendChild(b);
    const ok = righe.filter((r) => r.valore === d.corretta).length;
    const bc = document.createElement('span'); bc.className = 'badge corrette';
    bc.textContent = totale ? `${Math.round((ok / totale) * 100)}% corrette` : '— corrette';
    meta.appendChild(bc);
  }
  if (d.nuova) { const b = document.createElement('span'); b.className = 'badge nuova'; b.textContent = 'nuova'; meta.appendChild(b); }

  card.append(h, meta);
  d.opzioni.forEach((o) => {
    const n = righe.filter((r) => r.valore === o.id).length;
    card.appendChild(barra(o.testo, totale ? Math.round((n / totale) * 100) : 0, n, d.corretta === o.id));
  });
  return card;
}

async function aggiornaRisultati() {
  if (!sessione) return;
  const [{ data: partecipanti }, { data: risposte }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte_generiche').select('scenario_id, valore').eq('sessione_id', sessione.id)
  ]);

  const completati = (partecipanti || []).filter((p) => p.completed_at).length;
  el('conteggio').textContent = completati;

  const griglia = el('griglia');
  griglia.innerHTML = '';
  const domande = domandePer(sessione.contesto, sessione.momento);
  domande.forEach((d, i) => griglia.appendChild(cardDomanda(d, risposte || [], i + 1)));
  griglia.appendChild(cardDomanda({ ...ACCETTAZIONE, opzioni: ACCETTAZIONE.opzioni }, risposte || [], null));

  if (!esplosaGia && completati > 0) { esplosaGia = true; esplosioneParticelle(); }
}

// ---------- confronto iniziale / finale (KPI) ----------

async function renderConfronto() {
  const cont = el('confronto');
  cont.innerHTML = '<p class="nota">Caricamento…</p>';

  // Tutte le sessioni dello stesso contesto, iniziali e finali.
  const { data: sessioni } = await supabase
    .from('attivita_sessioni').select('id, momento')
    .eq('activity_key', ACTIVITY_KEY).eq('contesto', sessione.contesto);

  const ids = (sessioni || []).map((s) => s.id);
  if (!ids.length) { cont.innerHTML = '<p class="nota">Nessuna sessione disponibile.</p>'; return; }

  const { data: risposte } = await supabase
    .from('attivita_risposte_generiche').select('sessione_id, scenario_id, valore')
    .in('sessione_id', ids);

  const momentoDi = new Map((sessioni || []).map((s) => [s.id, s.momento]));
  const conoscenza = DOMANDE.filter((d) => d.corretta && (!d.solo || d.solo === sessione.contesto));

  cont.innerHTML = '';
  const intro = document.createElement('p');
  intro.className = 'nota';
  intro.style.marginTop = '0';
  intro.textContent = `Risposte corrette nelle domande di conoscenza, sommando tutte le sessioni ${CONTESTI[sessione.contesto].etichetta}.`;
  cont.appendChild(intro);

  conoscenza.forEach((d) => {
    const riga = document.createElement('div');
    riga.className = 'riga-confronto';
    const h = document.createElement('h3');
    h.textContent = d.testo;
    riga.appendChild(h);

    const calcola = (momento) => {
      const r = (risposte || []).filter((x) => x.scenario_id === d.id && momentoDi.get(x.sessione_id) === momento);
      const ok = r.filter((x) => x.valore === d.corretta).length;
      return { n: r.length, pct: r.length ? Math.round((ok / r.length) * 100) : null };
    };
    const ini = calcola('iniziale');
    const fin = calcola('finale');

    [['Iniziale', ini], ['Finale', fin]].forEach(([etichetta, v]) => {
      const c = document.createElement('div');
      c.className = 'coppia';
      const a = document.createElement('span'); a.textContent = etichetta;
      const traccia = document.createElement('div'); traccia.className = 'barra-traccia';
      const fill = document.createElement('div'); fill.className = 'barra-fill giusta'; fill.style.width = (v.pct ?? 0) + '%';
      traccia.appendChild(fill);
      const b = document.createElement('span');
      b.textContent = v.pct === null ? 'nessun dato' : `${v.pct}% (${v.n} risp.)`;
      c.append(a, traccia, b);
      riga.appendChild(c);
    });

    if (ini.pct !== null && fin.pct !== null) {
      const d2 = fin.pct - ini.pct;
      const dd = document.createElement('p');
      dd.className = 'delta ' + (d2 > 0 ? 'su' : d2 < 0 ? 'giu' : '');
      dd.style.margin = '0.4rem 0 0';
      dd.textContent = `Variazione: ${d2 > 0 ? '+' : ''}${d2} punti percentuali`;
      riga.appendChild(dd);
    }
    cont.appendChild(riga);
  });

  const nota = document.createElement('p');
  nota.className = 'nota';
  nota.textContent = 'Il confronto è fra gruppi, non fra le stesse persone: le risposte sono anonime e non si possono collegare. Con meno di 20 risposte per momento il dato va letto con cautela.';
  cont.appendChild(nota);
}

// ---------- controlli ----------

el('btn-crea').addEventListener('click', creaSessione);
el('btn-apri').addEventListener('click', () => aggiornaSessione({ stato: 'running', started_at: sessione.started_at || new Date().toISOString() }));
el('btn-chiudi').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-qr').addEventListener('click', () => {
  const nascosto = el('blocco-qr').classList.toggle('nascosto');
  el('btn-qr').textContent = nascosto ? 'Mostra QR' : 'Nascondi QR';
});
el('btn-proietta').addEventListener('click', () => {
  proiezione = !proiezione;
  const g = el('vista-risultati');
  g.classList.toggle('proiezione', proiezione);
  // Durante il quiz iniziale le risposte corrette restano nascoste in proiezione.
  const nascondi = proiezione && sessione.momento === 'iniziale';
  g.classList.toggle('nascondi-corrette', nascondi);
  el('avviso-proiezione').classList.toggle('nascosto', !nascondi);
  el('btn-proietta').textContent = proiezione ? 'Esci dalla proiezione' : 'Modalità proiezione';
});
el('btn-termina').addEventListener('click', async () => {
  if (!confirm('Terminare la sessione? Gli studenti non potranno più rispondere. I dati restano per il confronto.')) return;
  await aggiornaSessione({ stato: 'completed', ended_at: new Date().toISOString() });
  localStorage.removeItem(CHIAVE_SESSIONE);
});
el('btn-reset').addEventListener('click', async () => {
  if (!confirm('Cancellare definitivamente questa sessione e tutte le sue risposte? Non entreranno nel confronto iniziale/finale.')) return;
  await supabase.from('attivita_sessioni').delete().eq('id', sessione.id);
  localStorage.removeItem(CHIAVE_SESSIONE);
  if (canale) supabase.removeChannel(canale);
  sessione = null;
  el('blocco-sessione').classList.add('nascosto');
  el('blocco-configura').classList.remove('nascosto');
});

document.querySelectorAll('#tab-barra .tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('#tab-barra .tab').forEach((x) => x.classList.toggle('attivo', x === t));
    const confronto = t.dataset.tab === 'confronto';
    el('vista-risultati').classList.toggle('nascosto', confronto);
    el('vista-confronto').classList.toggle('nascosto', !confronto);
    if (confronto) renderConfronto();
  });
});

pulsantiScelta('scelta-contesto', CONTESTI, 'contesto');
pulsantiScelta('scelta-momento', MOMENTI, 'momento');
aggiornaRiepilogo();
riprendiSessione();
