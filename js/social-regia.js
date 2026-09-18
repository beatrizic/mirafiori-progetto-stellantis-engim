import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, SCENARI, OPZIONI_RIFLESSIONE } from './social-dati.js';
import { generaCodiceSessione, aggregaMomenti, confrontaPrimaDopo, cambioPercezione, media } from './attivita-logica.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_social';
const URL_STUDENTE = 'https://www.tobea.it/gioco-social.html';

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;
let tabAttivo = 'riepilogo';
let ultimiDati = { partecipanti: [], risposte: [] };

const statoLeggibile = (s) =>
  ({ waiting: 'In attesa', running: 'In corso', locked: 'Risposte chiuse', completed: 'Terminata' }[s] || s);

function abilitaControlli() {
  const attiva = !!sessione;
  ['btn-avvia', 'btn-qr', 'btn-blocca', 'btn-rivela', 'btn-termina', 'btn-reset']
    .forEach((id) => { const b = el(id); if (b) b.disabled = !attiva; });
  el('btn-crea').disabled = attiva;
  if (!attiva) return;
  el('btn-avvia').disabled = sessione.stato !== 'waiting';
  el('btn-blocca').disabled = sessione.stato !== 'running';
  el('btn-rivela').textContent = sessione.risultati_visibili ? 'Nascondi risultati' : 'Mostra risultati';
}

async function aggiornaSessione(campi) {
  const { data, error } = await supabase
    .from('attivita_sessioni').update(campi).eq('id', sessione.id).select().single();
  if (!error) { sessione = data; renderTestata(); }
}

// ---------- ciclo di vita ----------

async function creaSessione() {
  const { data, error } = await supabase
    .from('attivita_sessioni')
    .insert({ codice: generaCodiceSessione(), activity_key: ACTIVITY_KEY, stato: 'waiting' })
    .select().single();
  if (error) { alert('Non sono riuscita a creare la sessione. Riprova.'); return; }
  sessione = data;
  localStorage.setItem(CHIAVE_SESSIONE, sessione.id);
  qrDisegnato = false;
  avviaRealtime(); renderTestata(); disegnaQr(); await aggiornaDashboard();
}

async function riprendiSessione() {
  const id = localStorage.getItem(CHIAVE_SESSIONE);
  if (!id) { abilitaControlli(); return; }
  const { data } = await supabase.from('attivita_sessioni').select('*').eq('id', id).maybeSingle();
  if (!data || data.stato === 'completed') { localStorage.removeItem(CHIAVE_SESSIONE); abilitaControlli(); return; }
  sessione = data;
  avviaRealtime(); renderTestata(); disegnaQr(); await aggiornaDashboard();
}

function avviaRealtime() {
  if (canale) supabase.removeChannel(canale);
  canale = supabase.channel('regia-social-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte_generiche', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .subscribe((stato) => {
      el('stato-realtime-social').textContent = stato === 'SUBSCRIBED' ? 'collegata' : 'riconnessione…';
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

function renderTestata() {
  if (!sessione) return;
  el('blocco-sessione-social').classList.remove('nascosto');
  el('codice-sessione-social').textContent = sessione.codice;
  el('stato-sessione-social').textContent = statoLeggibile(sessione.stato);
  el('pannello-risultati-social').classList.toggle('proiezione', sessione.risultati_visibili);
  abilitaControlli();
}

function disegnaQr() {
  if (qrDisegnato || !sessione) return;
  const c = el('qr-social');
  c.innerHTML = '';
  const url = `${URL_STUDENTE}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(c, { text: url, width: 240, height: 240, colorDark: '#0e2a52', colorLight: '#ffffff' });
  el('url-studente-social').textContent = url;
  qrDisegnato = true;
}

// ---------- dashboard ----------

async function aggiornaDashboard() {
  if (!sessione) return;

  const [{ data: partecipanti }, { data: risposte }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte_generiche').select('partecipante_id, scenario_id, tipo, valore').eq('sessione_id', sessione.id)
  ]);

  ultimiDati = { partecipanti: partecipanti || [], risposte: risposte || [] };
  const { partecipanti: p, risposte: r } = ultimiDati;

  el('sn-collegati').textContent = p.length;
  el('sn-attivi').textContent = new Set(r.map((x) => x.partecipante_id)).size;
  el('sn-completati').textContent = p.filter((x) => x.completed_at).length;
  el('sn-risposte').textContent = r.length;

  // Scenario medio raggiunto: quanti scenari ha completato in media chi ha iniziato.
  const perPart = new Map();
  r.filter((x) => x.tipo === 'rating_after').forEach((x) => {
    perPart.set(x.partecipante_id, (perPart.get(x.partecipante_id) || 0) + 1);
  });
  const mediaScenari = media([...perPart.values()]);
  el('sn-scenario').textContent = mediaScenari === null ? '—' : mediaScenari.toFixed(1);

  renderTab();
}

function renderTab() {
  const cont = el('contenuto-tab');
  cont.innerHTML = '';
  if (tabAttivo === 'riepilogo') renderRiepilogo(cont);
  else renderScenario(cont, SCENARI.find((s) => s.id === tabAttivo));
}

// ---------- blocchi riutilizzabili ----------

function barraOrizzontale(etichetta, percentuale, conteggio, evidenzia = false) {
  const riga = document.createElement('div');
  riga.className = 'barra-riga';
  const lab = document.createElement('div');
  lab.className = 'barra-etichetta';
  const nome = document.createElement('span');
  nome.textContent = etichetta;
  if (evidenzia) nome.classList.add('primo');
  const val = document.createElement('span');
  val.textContent = `${percentuale}%${conteggio !== undefined ? ` (${conteggio})` : ''}`;
  lab.append(nome, val);
  const traccia = document.createElement('div');
  traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill';
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);
  riga.append(lab, traccia);
  return riga;
}

/** Istogramma verticale 1-10, leggibile da proiettore. */
function istogramma(distribuzione, titolo, colore) {
  const box = document.createElement('div');
  box.className = 'istogramma';
  const h = document.createElement('h4');
  h.textContent = titolo;
  box.appendChild(h);

  const griglia = document.createElement('div');
  griglia.className = 'isto-griglia';
  distribuzione.forEach((d) => {
    const col = document.createElement('div');
    col.className = 'isto-colonna';
    const barra = document.createElement('div');
    barra.className = 'isto-barra';
    barra.style.height = Math.max(2, d.altezzaRelativa) + '%';
    if (colore) barra.style.background = colore;
    barra.title = `Voto ${d.voto}: ${d.conteggio}`;
    const n = document.createElement('span');
    n.className = 'isto-conteggio';
    n.textContent = d.conteggio || '';
    const v = document.createElement('span');
    v.className = 'isto-voto';
    v.textContent = d.voto;
    col.append(n, barra, v);
    griglia.appendChild(col);
  });
  box.appendChild(griglia);
  return box;
}

// ---------- tab singolo scenario ----------

function renderScenario(cont, scenario) {
  if (!scenario) return;
  const { risposte } = ultimiDati;

  const h = document.createElement('h3');
  h.textContent = scenario.titolo;
  cont.appendChild(h);

  // 1. cosa pubblicherebbe la classe
  const sub1 = document.createElement('p');
  sub1.className = 'grigio sotto-titolo';
  sub1.textContent = 'Cosa pubblicherebbe la classe';
  cont.appendChild(sub1);

  const momenti = aggregaMomenti(scenario.momenti, risposte, scenario.id);
  const maxPct = Math.max(...momenti.map((m) => m.percentuale));
  const grigliaM = document.createElement('div');
  grigliaM.className = 'griglia-momenti-regia';

  momenti.forEach((m) => {
    const card = document.createElement('figure');
    card.className = 'card-momento-regia' + (m.percentuale === maxPct && m.conteggio > 0 ? ' vincente' : '');
    const img = document.createElement('img');
    img.src = m.immagine; img.alt = m.alt;
    img.onerror = () => { img.style.background = '#dde3ee'; };
    const cap = document.createElement('figcaption');
    const testo = document.createElement('span');
    testo.className = 'momento-testo';
    testo.textContent = m.testo;
    const pct = document.createElement('span');
    pct.className = 'momento-pct';
    pct.textContent = m.percentuale + '%';
    const n = document.createElement('span');
    n.className = 'momento-n';
    n.textContent = m.conteggio === 1 ? '1 studente' : `${m.conteggio} studenti`;
    cap.append(testo, pct, n);
    card.append(img, cap);
    grigliaM.appendChild(card);
  });
  cont.appendChild(grigliaM);

  // 2. prima vs dopo
  const c = confrontaPrimaDopo(risposte, scenario.id);

  const sub2 = document.createElement('p');
  sub2.className = 'grigio sotto-titolo';
  sub2.textContent = 'Percezione media';
  cont.appendChild(sub2);

  const confronto = document.createElement('div');
  confronto.className = 'confronto-medie';
  confronto.appendChild(boxMedia('Prima del BUT', c.mediaPrima, c.nPrima));
  confronto.appendChild(boxMedia('Dopo il BUT', c.mediaDopo, c.nDopo));
  confronto.appendChild(boxDelta(c.delta));
  cont.appendChild(confronto);

  // 3. distribuzioni
  const dist = document.createElement('div');
  dist.className = 'confronto-istogrammi';
  dist.appendChild(istogramma(c.distribuzionePrima, 'Prima', 'var(--blu)'));
  dist.appendChild(istogramma(c.distribuzioneDopo, 'Dopo', 'var(--accento)'));
  cont.appendChild(dist);

  // 4. cambio di percezione
  const cp = cambioPercezione(risposte, scenario.id);
  const sub3 = document.createElement('p');
  sub3.className = 'grigio sotto-titolo';
  sub3.textContent = `Come è cambiata la valutazione (${cp.totale} studenti con entrambe le risposte)`;
  cont.appendChild(sub3);

  const barre = document.createElement('div');
  barre.appendChild(barraOrizzontale('Percezione diminuita', cp.pctDiminuita, cp.diminuita));
  barre.appendChild(barraOrizzontale('Percezione invariata', cp.pctInvariata, cp.invariata));
  barre.appendChild(barraOrizzontale('Percezione aumentata', cp.pctAumentata, cp.aumentata));
  cont.appendChild(barre);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Distribuzione osservata in questa sessione. I dati mostrano cosa è successo nel gruppo, non perché sia successo: l\u2019interpretazione spetta al docente.';
  cont.appendChild(nota);
}

function boxMedia(etichetta, valore, n) {
  const b = document.createElement('div');
  b.className = 'box-media';
  const e = document.createElement('span'); e.className = 'bm-etichetta'; e.textContent = etichetta;
  const v = document.createElement('span'); v.className = 'bm-valore';
  v.textContent = valore === null ? '—' : `${valore} / 10`;
  const c = document.createElement('span'); c.className = 'bm-n'; c.textContent = `${n} risposte`;
  b.append(e, v, c);
  return b;
}

function boxDelta(delta) {
  const b = document.createElement('div');
  b.className = 'box-media delta';
  const e = document.createElement('span'); e.className = 'bm-etichetta'; e.textContent = 'Variazione';
  const v = document.createElement('span'); v.className = 'bm-valore';
  v.textContent = delta === null ? '—' : (delta > 0 ? '+' : '') + delta;
  const c = document.createElement('span'); c.className = 'bm-n';
  c.textContent = delta === null ? 'dati insufficienti' : 'punti sulla scala 1-10';
  b.append(e, v, c);
  return b;
}

// ---------- tab riepilogo ----------

function renderRiepilogo(cont) {
  const { risposte } = ultimiDati;

  const h1 = document.createElement('h3');
  h1.textContent = 'Contenuti più pubblicati';
  cont.appendChild(h1);

  const lista = document.createElement('div');
  lista.className = 'riepilogo-lista';
  SCENARI.forEach((s) => {
    const momenti = aggregaMomenti(s.momenti, risposte, s.id);
    const top = [...momenti].sort((a, b) => b.conteggio - a.conteggio)[0];
    const riga = document.createElement('div');
    riga.className = 'riga-riepilogo';
    const nome = document.createElement('span'); nome.className = 'rr-scenario'; nome.textContent = s.titolo;
    const scelto = document.createElement('span'); scelto.className = 'rr-valore';
    scelto.textContent = top && top.conteggio > 0 ? `${top.testo} — ${top.percentuale}%` : 'nessuna risposta';
    riga.append(nome, scelto);
    lista.appendChild(riga);
  });
  cont.appendChild(lista);

  const h2 = document.createElement('h3');
  h2.textContent = 'Variazione media per scenario';
  cont.appendChild(h2);

  const listaDelta = document.createElement('div');
  listaDelta.className = 'riepilogo-lista';
  SCENARI.forEach((s) => {
    const c = confrontaPrimaDopo(risposte, s.id);
    const riga = document.createElement('div');
    riga.className = 'riga-riepilogo';
    const nome = document.createElement('span'); nome.className = 'rr-scenario'; nome.textContent = s.titolo;
    const val = document.createElement('span'); val.className = 'rr-valore';
    val.textContent = c.delta === null ? '—' : (c.delta > 0 ? '+' : '') + c.delta;
    riga.append(nome, val);
    listaDelta.appendChild(riga);
  });
  cont.appendChild(listaDelta);

  // cambio complessivo
  const cp = cambioPercezione(risposte);
  const h3 = document.createElement('h3');
  h3.textContent = 'Cambio di percezione, tutti gli scenari';
  cont.appendChild(h3);
  const barre = document.createElement('div');
  barre.appendChild(barraOrizzontale('Diminuita', cp.pctDiminuita, cp.diminuita));
  barre.appendChild(barraOrizzontale('Invariata', cp.pctInvariata, cp.invariata));
  barre.appendChild(barraOrizzontale('Aumentata', cp.pctAumentata, cp.aumentata));
  cont.appendChild(barre);

  // risposta finale
  const h4 = document.createElement('h3');
  h4.textContent = 'Guarderai le Stories nello stesso modo?';
  cont.appendChild(h4);
  const finali = risposte.filter((r) => r.tipo === 'final_reflection');
  const barreF = document.createElement('div');
  OPZIONI_RIFLESSIONE.forEach((o) => {
    const n = finali.filter((f) => f.valore === o.id).length;
    const pct = finali.length ? Math.round((n / finali.length) * 100) : 0;
    barreF.appendChild(barraOrizzontale(o.label, pct, n));
  });
  cont.appendChild(barreF);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Nessun punteggio, nessuna classifica. Con pochi partecipanti le percentuali oscillano molto: commentare anche i valori assoluti.';
  cont.appendChild(nota);
}

// ---------- tab UI ----------

function costruisciTab() {
  const barra = el('tab-social');
  barra.innerHTML = '';
  const voci = [{ id: 'riepilogo', label: 'Riepilogo' }, ...SCENARI.map((s) => ({ id: s.id, label: s.titolo }))];
  voci.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (v.id === tabAttivo ? ' attivo' : '');
    b.textContent = v.label;
    b.setAttribute('aria-pressed', v.id === tabAttivo ? 'true' : 'false');
    b.addEventListener('click', () => {
      tabAttivo = v.id;
      [...barra.querySelectorAll('.tab')].forEach((x, i) => {
        x.classList.toggle('attivo', voci[i].id === tabAttivo);
        x.setAttribute('aria-pressed', voci[i].id === tabAttivo ? 'true' : 'false');
      });
      renderTab();
    });
    barra.appendChild(b);
  });
}

// ---------- controlli ----------

el('btn-crea').addEventListener('click', creaSessione);
el('btn-avvia').addEventListener('click', () => aggiornaSessione({ stato: 'running', started_at: new Date().toISOString() }));
el('btn-blocca').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-rivela').addEventListener('click', () => aggiornaSessione({ risultati_visibili: !sessione.risultati_visibili }));
el('btn-qr').addEventListener('click', () => {
  const nascosto = el('blocco-qr-social').classList.toggle('nascosto');
  el('btn-qr').textContent = nascosto ? 'Mostra QR' : 'Nascondi QR';
});
el('btn-termina').addEventListener('click', async () => {
  if (!confirm('Terminare la sessione? Gli studenti non potranno più rispondere.')) return;
  await aggiornaSessione({ stato: 'completed', ended_at: new Date().toISOString() });
});
el('btn-reset').addEventListener('click', async () => {
  if (!confirm('Cancellare definitivamente tutti i dati di questa sessione? L\u2019operazione non è reversibile.')) return;
  await supabase.from('attivita_sessioni').delete().eq('id', sessione.id);
  localStorage.removeItem(CHIAVE_SESSIONE);
  if (canale) supabase.removeChannel(canale);
  sessione = null; qrDisegnato = false;
  el('blocco-sessione-social').classList.add('nascosto');
  el('contenuto-tab').innerHTML = '';
  abilitaControlli();
});

costruisciTab();
riprendiSessione();
