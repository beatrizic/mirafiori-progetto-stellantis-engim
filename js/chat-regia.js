import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, NODI, NODO_INIZIALE, MOMENTI_LIMITE, AZIONI_DEBRIEF,
  ETICHETTE_CATEGORIA, STADI, PERSONAGGI, VARIANTI
} from './chat-dati.js';
import { generaCodiceSessione } from './attivita-logica.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_chat';
const URL_STUDENTE = new URL('gioco-chat.html', window.location.href).href;
const MIN_PER_CONFRONTO = 8;   // sotto questa soglia il confronto fra varianti non è leggibile

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;
let tabAttivo = 'limite';
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
  el('btn-rivela').textContent = sessione.risultati_visibili ? 'Nascondi risultati' : 'Rivela risultati';
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
  canale = supabase.channel('regia-chat-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte_generiche', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .subscribe((stato) => {
      el('stato-realtime-chat').textContent = stato === 'SUBSCRIBED' ? 'collegata' : 'riconnessione…';
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

function renderTestata() {
  if (!sessione) return;
  el('blocco-sessione-chat').classList.remove('nascosto');
  el('codice-sessione-chat').textContent = sessione.codice;
  el('stato-sessione-chat').textContent = statoLeggibile(sessione.stato);
  el('pannello-risultati-chat').classList.toggle('proiezione', sessione.risultati_visibili);
  abilitaControlli();
}

function disegnaQr() {
  if (qrDisegnato || !sessione) return;
  const c = el('qr-chat');
  c.innerHTML = '';
  const url = `${URL_STUDENTE}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(c, { text: url, width: 240, height: 240, colorDark: '#0e2a52', colorLight: '#ffffff' });
  el('url-studente-chat').textContent = url;
  qrDisegnato = true;
}

// ---------- aggregazione ----------

const scelteChat = (r) => r.filter((x) => x.tipo.startsWith('scelta:'));

/** Distribuzione delle risposte per un singolo nodo decisionale. */
function distribuzioneNodo(nodoId, risposte) {
  const nodo = NODI[nodoId];
  const righe = risposte.filter((r) => r.tipo === 'scelta:' + nodoId);
  const totale = righe.length;
  return {
    totale,
    opzioni: (nodo.risposte || []).map((o) => {
      const n = righe.filter((x) => x.valore === o.id).length;
      return { id: o.id, etichetta: o.etichetta, conteggio: n, percentuale: totale ? Math.round((n / totale) * 100) : 0 };
    })
  };
}

/** Percorsi effettivamente seguiti, ricostruiti dalle scelte di ciascun partecipante. */
function percorsiSeguiti(risposte) {
  const perPart = new Map();
  scelteChat(risposte).forEach((r) => {
    const nodo = r.tipo.slice(7);
    if (!perPart.has(r.partecipante_id)) perPart.set(r.partecipante_id, {});
    perPart.get(r.partecipante_id)[nodo] = r.valore;
  });

  const conta = new Map();
  perPart.forEach((scelte) => {
    let id = NODO_INIZIALE;
    const tappe = [];
    const visti = new Set();
    while (scelte[id] && !visti.has(id)) {
      visti.add(id);
      tappe.push(id);
      const sc = (NODI[id].risposte || []).find((r) => r.id === scelte[id]);
      if (!sc) break;
      id = sc.prossimo;
    }
    // Il ramo distintivo è dato dai primi due nodi: dopo, i percorsi convergono.
    if (tappe.length < 2) return;
    const chiave = tappe.slice(0, 2).join(' → ') + ' → …';
    conta.set(chiave, (conta.get(chiave) || 0) + 1);
  });

  const totale = [...conta.values()].reduce((a, b) => a + b, 0);
  return [...conta.entries()]
    .map(([k, n]) => ({ percorso: k, conteggio: n, percentuale: totale ? Math.round((n / totale) * 100) : 0 }))
    .sort((a, b) => b.conteggio - a.conteggio);
}

function distribuzioneLimite(risposte, filtroVariante = null) {
  let righe = risposte.filter((r) => r.tipo === 'limite');
  if (filtroVariante) righe = righe.filter((r) => r.scenario_id === filtroVariante);
  const totale = righe.length;
  return {
    totale,
    momenti: MOMENTI_LIMITE.map((m) => {
      const n = righe.filter((x) => x.valore === m.id).length;
      return { ...m, conteggio: n, percentuale: totale ? Math.round((n / totale) * 100) : 0 };
    })
  };
}

function distribuzioneAzioni(risposte) {
  const righe = risposte.filter((r) => r.tipo === 'debrief');
  const totale = righe.length;
  const scelte = righe.flatMap((r) => r.valore.split(','));
  return {
    totale,
    azioni: AZIONI_DEBRIEF.map((a) => {
      const n = scelte.filter((s) => s === a.id).length;
      return { ...a, conteggio: n, percentuale: totale ? Math.round((n / totale) * 100) : 0 };
    }).sort((x, y) => y.conteggio - x.conteggio)
  };
}

async function aggiornaDashboard() {
  if (!sessione) return;

  const [{ data: partecipanti }, { data: risposte }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at, variante').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte_generiche').select('partecipante_id, scenario_id, tipo, valore').eq('sessione_id', sessione.id)
  ]);

  ultimiDati = { partecipanti: partecipanti || [], risposte: risposte || [] };
  const { partecipanti: p, risposte: r } = ultimiDati;

  el('cn-collegati').textContent = p.length;
  el('cn-in-chat').textContent = new Set(scelteChat(r).map((x) => x.partecipante_id)).size;
  el('cn-debrief').textContent = new Set(r.filter((x) => x.tipo === 'limite').map((x) => x.partecipante_id)).size;
  el('cn-completati').textContent = p.filter((x) => x.completed_at).length;

  renderTab();
}

// ---------- blocchi UI ----------

function barra(etichetta, percentuale, conteggio, classe, evidenzia) {
  const riga = document.createElement('div');
  riga.className = 'barra-riga';
  const lab = document.createElement('div');
  lab.className = 'barra-etichetta';
  const nome = document.createElement('span');
  nome.textContent = etichetta;
  if (evidenzia) nome.classList.add('primo');
  const val = document.createElement('span');
  val.className = 'barra-valore';
  val.textContent = `${percentuale}% (${conteggio})`;
  lab.append(nome, val);
  const traccia = document.createElement('div');
  traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill' + (classe ? ' ' + classe : '');
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);
  riga.append(lab, traccia);
  return riga;
}

function titoletto(testo) {
  const p = document.createElement('p');
  p.className = 'grigio sotto-titolo';
  p.textContent = testo;
  return p;
}

// ---------- tab: momento del limite (principale) ----------

function renderLimite(cont) {
  const { risposte } = ultimiDati;
  const d = distribuzioneLimite(risposte);

  const h = document.createElement('h3');
  h.textContent = 'Quando secondo la classe è stato superato il limite?';
  cont.appendChild(h);

  const sub = document.createElement('p');
  sub.className = 'grigio';
  sub.textContent = `${d.totale} risposte`;
  cont.appendChild(sub);

  const max = Math.max(...d.momenti.map((m) => m.conteggio));
  const box = document.createElement('div');
  box.className = 'timeline-regia';
  d.momenti.forEach((m, i) => {
    const riga = document.createElement('div');
    riga.className = 'tappa';
    const n = document.createElement('span');
    n.className = 'tappa-numero';
    n.textContent = i + 1;
    const corpo = document.createElement('div');
    corpo.className = 'tappa-corpo';
    const et = document.createElement('span');
    et.className = 'tappa-etichetta';
    et.textContent = m.etichetta;
    const tx = document.createElement('span');
    tx.className = 'tappa-testo';
    tx.textContent = m.testo;
    corpo.append(et, tx);
    corpo.appendChild(barra('', m.percentuale, m.conteggio, m.conteggio === max && max > 0 ? 'evidenza' : '', false));
    riga.append(n, corpo);
    box.appendChild(riga);
  });
  cont.appendChild(box);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Non c\u2019è una risposta corretta: il grafico serve ad aprire la discussione. Che il limite sia stato individuato presto o tardi, la responsabilità resta di chi aggredisce.';
  cont.appendChild(nota);

  // confronto fra varianti, solo con numeri sufficienti
  const dA = distribuzioneLimite(risposte, 'A');
  const dB = distribuzioneLimite(risposte, 'B');
  if (dA.totale + dB.totale >= MIN_PER_CONFRONTO && dA.totale > 0 && dB.totale > 0) {
    cont.appendChild(titoletto('Il genere del personaggio cambia la percezione?'));
    const conf = document.createElement('div');
    conf.className = 'confronto-varianti';
    [['A', dA], ['B', dB]].forEach(([v, dd]) => {
      const col = document.createElement('div');
      col.className = 'colonna-variante';
      const t = document.createElement('h4');
      t.textContent = `Aggressore ${PERSONAGGI[VARIANTI[v].aggressore].nome} — ${dd.totale} risposte`;
      col.appendChild(t);
      dd.momenti.forEach((m) => col.appendChild(barra(m.etichetta, m.percentuale, m.conteggio, '', false)));
      conf.appendChild(col);
    });
    cont.appendChild(conf);
    const n2 = document.createElement('p');
    n2.className = 'nota-lettura';
    n2.textContent = 'Confronto fra i due scenari, non fra gli studenti: non conosciamo il genere di chi ha risposto. Dato descrittivo, non conclusivo.';
    cont.appendChild(n2);
  }
}

// ---------- tab: azioni ----------

function renderAzioni(cont) {
  const d = distribuzioneAzioni(ultimiDati.risposte);

  const h = document.createElement('h3');
  h.textContent = 'Cosa farebbe la classe';
  cont.appendChild(h);
  const sub = document.createElement('p');
  sub.className = 'grigio';
  sub.textContent = `${d.totale} studenti · risposte multiple, la somma supera il 100%`;
  cont.appendChild(sub);

  const box = document.createElement('div');
  d.azioni.forEach((a) => {
    const riga = barra(a.etichetta, a.percentuale, a.conteggio, 'cat-' + a.categoria, false);
    const tag = document.createElement('span');
    tag.className = 'tag-cat ' + a.categoria;
    tag.textContent = ETICHETTE_CATEGORIA[a.categoria];
    riga.appendChild(tag);
    box.appendChild(riga);
  });
  cont.appendChild(box);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Le etichette a destra servono a te per guidare la discussione. Nessuno studente le ha viste prima di rispondere, e nessuna scelta viene presentata come sbagliata.';
  cont.appendChild(nota);
}

// ---------- tab: scelte nella chat ----------

function renderScelte(cont) {
  const { risposte } = ultimiDati;
  const h = document.createElement('h3');
  h.textContent = 'Le scelte nella conversazione';
  cont.appendChild(h);

  Object.values(NODI).filter((n) => n.risposte).forEach((nodo) => {
    const d = distribuzioneNodo(nodo.id, risposte);
    if (!d.totale) return;

    const card = document.createElement('div');
    card.className = 'card-nodo';

    const stadio = document.createElement('span');
    stadio.className = 'tag-stadio';
    stadio.textContent = STADI[nodo.stadio].etichetta;

    const msg = document.createElement('p');
    msg.className = 'messaggio-nodo';
    const ultimo = [...nodo.messaggi].reverse().find((m) => !m.tipo || m.tipo === 'messaggio');
    msg.textContent = '\u201C' + (ultimo ? ultimo.testo : '\u2026') + '\u201D';

    const conteggio = document.createElement('p');
    conteggio.className = 'grigio';
    conteggio.style.fontSize = '0.8rem';
    conteggio.textContent = `${d.totale} risposte`;

    card.append(stadio, msg, conteggio);
    const max = Math.max(...d.opzioni.map((o) => o.conteggio));
    d.opzioni.forEach((o) => card.appendChild(barra(o.etichetta, o.percentuale, o.conteggio, o.conteggio === max && max > 0 ? 'evidenza' : '', false)));
    cont.appendChild(card);
  });

  if (!cont.querySelector('.card-nodo')) {
    const p = document.createElement('p');
    p.className = 'grigio';
    p.textContent = 'Nessuna risposta ancora.';
    cont.appendChild(p);
  }
}

// ---------- tab: percorsi ----------

function renderPercorsi(cont) {
  const h = document.createElement('h3');
  h.textContent = 'I percorsi più seguiti';
  cont.appendChild(h);

  const p = percorsiSeguiti(ultimiDati.risposte);
  if (!p.length) {
    const vuoto = document.createElement('p');
    vuoto.className = 'grigio';
    vuoto.textContent = 'Nessun percorso completo ancora.';
    cont.appendChild(vuoto);
    return;
  }
  const box = document.createElement('div');
  p.slice(0, 6).forEach((x, i) => box.appendChild(barra(x.percorso, x.percentuale, x.conteggio, i === 0 ? 'evidenza' : '', i === 0)));
  cont.appendChild(box);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'I rami si differenziano solo all\u2019inizio: dopo i primi scambi tutti i percorsi convergono. È voluto — nessuna risposta poteva cambiare il finale.';
  cont.appendChild(nota);
}

// ---------- tab ----------

function renderTab() {
  const cont = el('contenuto-tab-chat');
  cont.innerHTML = '';
  if (tabAttivo === 'limite')        renderLimite(cont);
  else if (tabAttivo === 'azioni')   renderAzioni(cont);
  else if (tabAttivo === 'scelte')   renderScelte(cont);
  else                                renderPercorsi(cont);
}

function costruisciTab() {
  const barraTab = el('tab-chat');
  barraTab.innerHTML = '';
  const voci = [
    { id: 'limite',   label: 'Il limite' },
    { id: 'azioni',   label: 'Cosa farebbero' },
    { id: 'scelte',   label: 'Le scelte' },
    { id: 'percorsi', label: 'I percorsi' }
  ];
  voci.forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (v.id === tabAttivo ? ' attivo' : '');
    b.textContent = v.label;
    b.setAttribute('aria-pressed', v.id === tabAttivo ? 'true' : 'false');
    b.addEventListener('click', () => {
      tabAttivo = v.id;
      [...barraTab.querySelectorAll('.tab')].forEach((x, i) => {
        x.classList.toggle('attivo', voci[i].id === tabAttivo);
        x.setAttribute('aria-pressed', voci[i].id === tabAttivo ? 'true' : 'false');
      });
      renderTab();
    });
    barraTab.appendChild(b);
  });
}

// ---------- controlli ----------

el('btn-crea').addEventListener('click', creaSessione);
el('btn-avvia').addEventListener('click', () => aggiornaSessione({ stato: 'running', started_at: new Date().toISOString() }));
el('btn-blocca').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-rivela').addEventListener('click', () => aggiornaSessione({ risultati_visibili: !sessione.risultati_visibili }));
el('btn-qr').addEventListener('click', () => {
  const nascosto = el('blocco-qr-chat').classList.toggle('nascosto');
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
  el('blocco-sessione-chat').classList.add('nascosto');
  el('contenuto-tab-chat').innerHTML = '';
  abilitaControlli();
});

costruisciTab();
riprendiSessione();
