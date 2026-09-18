import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, SFIDE, OPZIONI_RIFLESSIONE } from './prompt-dati.js';
import { generaCodiceSessione } from './attivita-logica.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_prompt';
const URL_STUDENTE = 'https://www.tobea.it/gioco-prompt.html';
const ETICHETTE_QUALITA = {
  debole: 'Troppo vago', medio: 'Discreto', forte: 'Completo', trappola: 'Con un problema'
};

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
  canale = supabase.channel('regia-prompt-' + sessione.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_risposte_generiche', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attivita_partecipanti', filter: 'sessione_id=eq.' + sessione.id }, aggiornaDashboard)
    .subscribe((stato) => {
      el('stato-realtime-prompt').textContent = stato === 'SUBSCRIBED' ? 'collegata' : 'riconnessione…';
      if (stato === 'CHANNEL_ERROR' || stato === 'TIMED_OUT') setTimeout(avviaRealtime, 3000);
    });
}

function renderTestata() {
  if (!sessione) return;
  el('blocco-sessione-prompt').classList.remove('nascosto');
  el('codice-sessione-prompt').textContent = sessione.codice;
  el('stato-sessione-prompt').textContent = statoLeggibile(sessione.stato);
  el('pannello-risultati-prompt').classList.toggle('proiezione', sessione.risultati_visibili);
  abilitaControlli();
}

function disegnaQr() {
  if (qrDisegnato || !sessione) return;
  const c = el('qr-prompt');
  c.innerHTML = '';
  const url = `${URL_STUDENTE}?s=${sessione.codice}`;
  // eslint-disable-next-line no-undef
  new QRCode(c, { text: url, width: 240, height: 240, colorDark: '#0e2a52', colorLight: '#ffffff' });
  el('url-studente-prompt').textContent = url;
  qrDisegnato = true;
}

// ---------- aggregazione ----------

/** Percentuali di scelta dei 4 prompt di una sfida, per fase. */
function aggregaScelte(sfida, risposte, tipo) {
  const scelte = risposte.filter((r) => r.scenario_id === sfida.id && r.tipo === tipo);
  const totale = scelte.length;
  return {
    totale,
    righe: sfida.prompt.map((p) => {
      const n = scelte.filter((s) => s.valore === p.id).length;
      return {
        id: p.id, testo: p.testo, qualita: p.qualita,
        conteggio: n,
        percentuale: totale === 0 ? 0 : Math.round((n / totale) * 100)
      };
    })
  };
}

/** Quanti studenti hanno cambiato idea dopo aver visto le risposte. */
function cambioIdea(risposte, sfidaId = null) {
  const filtrate = sfidaId ? risposte.filter((r) => r.scenario_id === sfidaId) : risposte;
  const coppie = new Map();
  filtrate.forEach((r) => {
    if (r.tipo !== 'scelta_prima' && r.tipo !== 'scelta_dopo') return;
    const k = r.partecipante_id + '|' + r.scenario_id;
    if (!coppie.has(k)) coppie.set(k, {});
    coppie.get(k)[r.tipo] = r.valore;
  });
  let cambiati = 0, confermati = 0, totale = 0;
  coppie.forEach((c) => {
    if (!c.scelta_prima || !c.scelta_dopo) return;
    totale++;
    if (c.scelta_prima === c.scelta_dopo) confermati++; else cambiati++;
  });
  const pct = (n) => (totale === 0 ? 0 : Math.round((n / totale) * 100));
  return { totale, cambiati, confermati, pctCambiati: pct(cambiati), pctConfermati: pct(confermati) };
}

async function aggiornaDashboard() {
  if (!sessione) return;

  const [{ data: partecipanti }, { data: risposte }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at').eq('sessione_id', sessione.id),
    supabase.from('attivita_risposte_generiche').select('partecipante_id, scenario_id, tipo, valore').eq('sessione_id', sessione.id)
  ]);

  ultimiDati = { partecipanti: partecipanti || [], risposte: risposte || [] };
  const { partecipanti: p, risposte: r } = ultimiDati;

  el('pn-collegati').textContent = p.length;
  el('pn-attivi').textContent = new Set(r.map((x) => x.partecipante_id)).size;
  el('pn-completati').textContent = p.filter((x) => x.completed_at).length;
  el('pn-risposte').textContent = r.length;

  const ci = cambioIdea(r);
  el('pn-cambiati').textContent = ci.totale ? ci.pctCambiati + '%' : '—';

  renderTab();
}

// ---------- blocchi UI ----------

function barra(etichetta, percentuale, conteggio, qualita, evidenzia) {
  const riga = document.createElement('div');
  riga.className = 'barra-riga';

  const lab = document.createElement('div');
  lab.className = 'barra-etichetta';
  const nome = document.createElement('span');
  nome.className = 'prompt-testo';
  nome.textContent = etichetta;
  if (evidenzia) nome.classList.add('primo');
  const val = document.createElement('span');
  val.className = 'barra-valore';
  val.textContent = `${percentuale}% (${conteggio})`;
  lab.append(nome, val);

  const traccia = document.createElement('div');
  traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill q-' + qualita;
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);

  const tag = document.createElement('span');
  tag.className = 'tag-qualita q-' + qualita;
  tag.textContent = ETICHETTE_QUALITA[qualita] || qualita;

  riga.append(lab, traccia, tag);
  return riga;
}

function colonnaScelte(titolo, dati) {
  const box = document.createElement('div');
  box.className = 'colonna-scelte';
  const h = document.createElement('h4');
  h.textContent = `${titolo} — ${dati.totale} risposte`;
  box.appendChild(h);
  const ordinate = [...dati.righe].sort((a, b) => b.conteggio - a.conteggio);
  const max = ordinate[0]?.conteggio || 0;
  ordinate.forEach((d) => {
    box.appendChild(barra(d.testo, d.percentuale, d.conteggio, d.qualita, d.conteggio === max && max > 0));
  });
  return box;
}

// ---------- tab singola sfida ----------

function renderSfida(cont, sfida) {
  const { risposte } = ultimiDati;

  const h = document.createElement('h3');
  h.textContent = sfida.titolo;
  cont.appendChild(h);

  const ob = document.createElement('p');
  ob.className = 'obiettivo-regia';
  ob.textContent = sfida.obiettivo;
  cont.appendChild(ob);

  const confronto = document.createElement('div');
  confronto.className = 'confronto-scelte';
  confronto.appendChild(colonnaScelte('Prima di vedere le risposte', aggregaScelte(sfida, risposte, 'scelta_prima')));
  confronto.appendChild(colonnaScelte('Dopo', aggregaScelte(sfida, risposte, 'scelta_dopo')));
  cont.appendChild(confronto);

  const ci = cambioIdea(risposte, sfida.id);
  const sub = document.createElement('p');
  sub.className = 'grigio sotto-titolo';
  sub.textContent = `Chi ha cambiato idea (${ci.totale} studenti con entrambe le scelte)`;
  cont.appendChild(sub);

  const barre = document.createElement('div');
  barre.appendChild(barra('Ha cambiato prompt', ci.pctCambiati, ci.cambiati, 'forte', false));
  barre.appendChild(barra('Ha confermato', ci.pctConfermati, ci.confermati, 'medio', false));
  cont.appendChild(barre);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Le etichette sulla destra sono una guida per la discussione, non un voto: nessun prompt è sbagliato in assoluto. Cambiare idea dopo aver visto le risposte non è un errore, è il senso dell\u2019attività.';
  cont.appendChild(nota);
}

// ---------- tab riepilogo ----------

function renderRiepilogo(cont) {
  const { risposte } = ultimiDati;

  const h1 = document.createElement('h3');
  h1.textContent = 'Prompt più scelto, per sfida';
  cont.appendChild(h1);

  const lista = document.createElement('div');
  lista.className = 'riepilogo-lista';
  SFIDE.forEach((s) => {
    const dati = aggregaScelte(s, risposte, 'scelta_dopo');
    const top = [...dati.righe].sort((a, b) => b.conteggio - a.conteggio)[0];
    const riga = document.createElement('div');
    riga.className = 'riga-riepilogo';
    const nome = document.createElement('span'); nome.className = 'rr-scenario'; nome.textContent = s.titolo;
    const val = document.createElement('span'); val.className = 'rr-valore';
    val.textContent = top && top.conteggio > 0
      ? `${ETICHETTE_QUALITA[top.qualita]} — ${top.percentuale}%`
      : 'nessuna risposta';
    riga.append(nome, val);
    lista.appendChild(riga);
  });
  cont.appendChild(lista);

  const h2 = document.createElement('h3');
  h2.textContent = 'Chi ha cambiato idea, per sfida';
  cont.appendChild(h2);
  const lista2 = document.createElement('div');
  lista2.className = 'riepilogo-lista';
  SFIDE.forEach((s) => {
    const ci = cambioIdea(risposte, s.id);
    const riga = document.createElement('div');
    riga.className = 'riga-riepilogo';
    const nome = document.createElement('span'); nome.className = 'rr-scenario'; nome.textContent = s.titolo;
    const val = document.createElement('span'); val.className = 'rr-valore';
    val.textContent = ci.totale ? `${ci.pctCambiati}% (${ci.cambiati} su ${ci.totale})` : '—';
    riga.append(nome, val);
    lista2.appendChild(riga);
  });
  cont.appendChild(lista2);

  const h3 = document.createElement('h3');
  h3.textContent = 'Cambierai il modo in cui scrivi le richieste?';
  cont.appendChild(h3);
  const finali = risposte.filter((r) => r.tipo === 'final_reflection');
  const barreF = document.createElement('div');
  OPZIONI_RIFLESSIONE.forEach((o) => {
    const n = finali.filter((f) => f.valore === o.id).length;
    const pct = finali.length ? Math.round((n / finali.length) * 100) : 0;
    barreF.appendChild(barra(o.label, pct, n, 'medio', false));
  });
  cont.appendChild(barreF);

  const nota = document.createElement('p');
  nota.className = 'nota-lettura';
  nota.textContent = 'Nessun punteggio, nessuna classifica. Con pochi partecipanti le percentuali oscillano molto: commentare anche i valori assoluti.';
  cont.appendChild(nota);
}

function renderTab() {
  const cont = el('contenuto-tab-prompt');
  cont.innerHTML = '';
  if (tabAttivo === 'riepilogo') renderRiepilogo(cont);
  else renderSfida(cont, SFIDE.find((s) => s.id === tabAttivo));
}

function costruisciTab() {
  const barraTab = el('tab-prompt');
  barraTab.innerHTML = '';
  const voci = [{ id: 'riepilogo', label: 'Riepilogo' }, ...SFIDE.map((s) => ({ id: s.id, label: s.titolo }))];
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
  const nascosto = el('blocco-qr-prompt').classList.toggle('nascosto');
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
  el('blocco-sessione-prompt').classList.add('nascosto');
  el('contenuto-tab-prompt').innerHTML = '';
  abilitaControlli();
});

costruisciTab();
riprendiSessione();
