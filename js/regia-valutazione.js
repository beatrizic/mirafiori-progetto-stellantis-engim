import { supabase } from './supabase-client.js';
import {
  ACTIVITY_KEY, CONTESTI, FASI, ARGOMENTI, TEST,
  domandePer, eCorretta, tutteLeDomande, fasciaDi
} from './valutazione-dati.js';
import { generaCodiceSessione, media } from './attivita-logica.js';
import { esplosioneParticelle } from './particelle.js';

const CHIAVE_SESSIONE = 'mirafiori_sessione_valutazione';
const URL_STUDENTE = new URL('valutazione.html', window.location.href).href;
const NOME_ENGIM = 'ENGIM San Luca';
let scuoleNote = [];

const el = (id) => document.getElementById(id);
let sessione = null;
let canale = null;
let qrDisegnato = false;
let proiezione = false;
let esplosaGia = false;
let vista = 'sintesi';
let dati = { partecipanti: [], risposte: [] };
let scelta = { argomento: 'citizenship', contesto: 'esterna' };

const statoLeggibile = (s) =>
  ({ waiting: 'In attesa', running: 'Aperto', locked: 'Chiuso', completed: 'Terminato' }[s] || s);
const numero = (x) => (x === null || x === undefined ? '—' : x.toLocaleString('it-IT', { maximumFractionDigits: 1 }));

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
      aggiornaCampoScuola();
    });
    cont.appendChild(b);
  });
}

function aggiornaRiepilogo() {
  const f = fasciaDi(scelta.argomento);
  const test = (TEST[scelta.argomento] || []).length;
  const ingresso = domandePer(scelta.argomento, 'ingresso').length;
  const uscita = domandePer(scelta.argomento, 'uscita').length;
  el('riepilogo-domande').textContent =
    `Ingresso: ${ingresso} domande (${f.stemIngresso.length} sulle STEM e ${test} di test). Uscita: ${uscita} domande (lo stesso test, ${f.stemUscita.length} sulle STEM e il gradimento).`
    + (ARGOMENTI[scelta.argomento].fascia === 'primaria' ? ' Domande e gradimento in versione semplificata per la primaria.' : '');
}

// ---------- scuola e classe ----------

/** Spazi ripuliti; se la scuola esiste già con altre maiuscole, si usa la grafia già registrata. */
function normalizzaScuola(testo) {
  const pulito = (testo || '').replace(/\s+/g, ' ').trim();
  if (!pulito) return '';
  const esistente = scuoleNote.find((x) => x.toLowerCase() === pulito.toLowerCase());
  return esistente || pulito;
}

async function caricaScuoleNote() {
  // Le scuole già scritte nel quiz iniziale o nelle valutazioni: una sola grafia per tutto il progetto.
  const { data } = await supabase
    .from('attivita_sessioni').select('scuola')
    .in('activity_key', [ACTIVITY_KEY, 'quiz-baseline']).eq('contesto', 'esterna').not('scuola', 'is', null);
  scuoleNote = [...new Set((data || []).map((r) => r.scuola).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  const lista = el('elenco-scuole');
  lista.innerHTML = '';
  scuoleNote.forEach((n) => { const o = document.createElement('option'); o.value = n; lista.appendChild(o); });
}

function aggiornaCampoScuola() {
  const esterna = scelta.contesto === 'esterna';
  el('gruppo-scuola').classList.toggle('nascosto', !esterna);
  if (!esterna) { el('errore-scuola').classList.add('nascosto'); el('campo-scuola').classList.remove('errore'); }
}

// ---------- ciclo di vita ----------

async function creaSessione() {
  let scuola = NOME_ENGIM;
  if (scelta.contesto === 'esterna') {
    scuola = normalizzaScuola(el('campo-scuola').value);
    if (!scuola) {
      el('errore-scuola').classList.remove('nascosto');
      el('campo-scuola').classList.add('errore');
      el('campo-scuola').focus();
      return;
    }
  }
  const classe = (el('campo-classe').value || '').replace(/\s+/g, ' ').trim() || null;

  el('btn-crea').disabled = true;
  const { data, error } = await supabase
    .from('attivita_sessioni')
    .insert({
      codice: generaCodiceSessione(),
      activity_key: ACTIVITY_KEY,
      stato: 'waiting',
      fase: 'ingresso',
      scenario_corrente: scelta.argomento,
      contesto: scelta.contesto,
      scuola,
      classe
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
  canale = supabase.channel('regia-valutazione-' + sessione.id)
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
  if (!error) { sessione = data; renderTestata(); aggiornaProiezione(); }
}

function renderTestata() {
  const argomento = ARGOMENTI[sessione.scenario_corrente]?.etichetta || '—';
  const contesto = CONTESTI[sessione.contesto]?.etichetta || '—';
  const fase = FASI[sessione.fase]?.etichetta || '—';
  el('titolo-sessione').textContent = `Valutazione · ${argomento}`;
  el('pillola-fase').textContent = fase;
  el('pillola-contesto').textContent = contesto;
  el('pillola-scuola').textContent = sessione.scuola || contesto;
  el('pillola-classe').textContent = sessione.classe ? 'Classe ' + sessione.classe : '';
  el('pillola-classe').classList.toggle('nascosto', !sessione.classe);
  el('codice-sessione').textContent = sessione.codice;
  el('stato-sessione').textContent = `${statoLeggibile(sessione.stato)} (${fase.toLowerCase()})`;
  const aperto = sessione.stato === 'running';
  el('btn-apri-ingresso').disabled = aperto && sessione.fase === 'ingresso';
  el('btn-apri-uscita').disabled = aperto && sessione.fase === 'uscita';
  el('btn-chiudi').disabled = !aperto;
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

// ---------- calcoli ----------

const righeDi = (id, fase) => dati.risposte.filter((r) => r.scenario_id === id && r.tipo === fase);
const domandaPer = (id) => tutteLeDomande(sessione.scenario_corrente).find((d) => d.id === id);
const testCorrente = () => TEST[sessione.scenario_corrente] || [];
const fascia = () => fasciaDi(sessione.scenario_corrente);

/** Percentuale di risposte corrette di una domanda in una fase. */
function corrette(d, fase) {
  const r = righeDi(d.id, fase);
  const ok = r.filter((x) => eCorretta(d, x.valore)).length;
  return { n: r.length, pct: r.length ? Math.round((ok / r.length) * 100) : null };
}

/** Percentuale di risposte corrette sull'intero test in una fase. */
function corretteTest(fase) {
  let tot = 0, ok = 0;
  testCorrente().forEach((d) => {
    const r = righeDi(d.id, fase);
    tot += r.length;
    ok += r.filter((x) => eCorretta(d, x.valore)).length;
  });
  return { n: tot, pct: tot ? Math.round((ok / tot) * 100) : null };
}

/** Punteggi sulle stesse persone: solo chi ha fatto il test intero sia all'ingresso sia all'uscita. */
function punteggiAppaiati() {
  const test = testCorrente();
  const punteggio = (pid, fase) => {
    const r = dati.risposte.filter((x) => x.partecipante_id === pid && x.tipo === fase);
    if (test.some((d) => !r.find((x) => x.scenario_id === d.id))) return null;
    return test.filter((d) => eCorretta(d, r.find((x) => x.scenario_id === d.id).valore)).length;
  };
  const prima = [], dopo = [];
  dati.partecipanti.forEach((p) => {
    const a = punteggio(p.id, 'ingresso');
    const b = punteggio(p.id, 'uscita');
    if (a !== null && b !== null) { prima.push(a); dopo.push(b); }
  });
  return { n: prima.length, prima: media(prima), dopo: media(dopo), migliorati: prima.filter((x, i) => dopo[i] > x).length };
}

const valoriNumerici = (id, fase) => righeDi(id, fase).map((r) => Number(r.valore)).filter(Number.isFinite);
const percentualeDi = (id, fase, valore) => {
  const r = righeDi(id, fase);
  return r.length ? Math.round((r.filter((x) => x.valore === valore).length / r.length) * 100) : null;
};

function partecipantiFase(fase) {
  return new Set(dati.risposte.filter((r) => r.tipo === fase).map((r) => r.partecipante_id)).size;
}

// ---------- elementi grafici ----------

function barra(testo, percentuale, conteggio, giusta) {
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
  fill.className = 'barra-fill' + (giusta ? ' giusta' : '');
  fill.style.width = percentuale + '%';
  traccia.appendChild(fill);
  riga.append(lab, traccia);
  return riga;
}

function coppia(etichetta, percentuale, testo, giusta = true) {
  const c = document.createElement('div');
  c.className = 'coppia';
  const a = document.createElement('span'); a.textContent = etichetta;
  const traccia = document.createElement('div'); traccia.className = 'barra-traccia';
  const fill = document.createElement('div');
  fill.className = 'barra-fill' + (giusta ? ' giusta' : '');
  fill.style.width = (percentuale ?? 0) + '%';
  traccia.appendChild(fill);
  const b = document.createElement('span'); b.textContent = testo;
  c.append(a, traccia, b);
  return c;
}

function delta(prima, dopo, unita = 'punti percentuali') {
  if (prima === null || dopo === null) return null;
  const d = Math.round((dopo - prima) * 10) / 10;
  const p = document.createElement('p');
  p.className = 'delta ' + (d > 0 ? 'su' : d < 0 ? 'giu' : '');
  p.style.margin = '0.4rem 0 0';
  p.textContent = `Variazione: ${d > 0 ? '+' : ''}${numero(d)} ${unita}`;
  return p;
}

function card(titolo, metaTesto) {
  const c = document.createElement('article');
  c.className = 'card';
  const h = document.createElement('h3');
  h.textContent = titolo;
  c.appendChild(h);
  if (metaTesto) {
    const m = document.createElement('div');
    m.className = 'meta';
    m.textContent = metaTesto;
    c.appendChild(m);
  }
  return c;
}

function rigaConfronto(titolo) {
  const r = document.createElement('div');
  r.className = 'riga-confronto';
  const h = document.createElement('h3');
  h.textContent = titolo;
  r.appendChild(h);
  return r;
}

function nota(testo) {
  const p = document.createElement('p');
  p.className = 'nota';
  p.textContent = testo;
  return p;
}

/** Card con la distribuzione delle risposte di una domanda in una fase. */
function cardDistribuzione(d, fase, titolo) {
  const r = righeDi(d.id, fase);
  const totale = r.length;
  const c = card(titolo || d.testo, null);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.appendChild(document.createTextNode(`${totale} risposte · ${FASI[fase].etichetta.toLowerCase()}`));
  if (d.tipo === 'scala') {
    const b = document.createElement('span'); b.className = 'badge conoscenza';
    b.textContent = `media ${numero(media(valoriNumerici(d.id, fase)))} su 5`;
    meta.appendChild(b);
  }
  if (d.corretta) {
    const ok = r.filter((x) => eCorretta(d, x.valore)).length;
    const b = document.createElement('span'); b.className = 'badge corrette';
    b.textContent = totale ? `${Math.round((ok / totale) * 100)}% tutte giuste` : '— corrette';
    meta.appendChild(b);
  }
  c.appendChild(meta);

  d.opzioni.forEach((o) => {
    // Nelle domande a scelta multipla si conta chi ha scelto ogni opzione.
    const n = r.filter((x) => String(x.valore).split(',').includes(o.id)).length;
    const giusta = Array.isArray(d.corretta) ? d.corretta.includes(o.id) : d.corretta === o.id;
    c.appendChild(barra(o.testo, totale ? Math.round((n / totale) * 100) : 0, n, giusta));
  });
  return c;
}

// ---------- viste ----------

function vistaSintesi(cont) {
  const griglia = document.createElement('div');
  griglia.className = 'griglia';

  // Test
  const ti = corretteTest('ingresso'), tu = corretteTest('uscita');
  const cTest = card('Test sull’argomento', 'Risposte corrette, tutta la classe');
  cTest.append(
    coppia('Ingresso', ti.pct, ti.pct === null ? 'nessun dato' : `${ti.pct}%`),
    coppia('Uscita', tu.pct, tu.pct === null ? 'nessun dato' : `${tu.pct}%`)
  );
  const dt = delta(ti.pct, tu.pct); if (dt) cTest.appendChild(dt);
  griglia.appendChild(cTest);

  // Stesse persone
  const ap = punteggiAppaiati();
  const cAp = card('Sulle stesse persone', `${ap.n} ${ap.n === 1 ? 'studente ha' : 'studenti hanno'} fatto il test sia all'ingresso sia all'uscita`);
  const v = document.createElement('div'); v.className = 'valore-grande';
  v.textContent = ap.n ? `${numero(ap.prima)} → ${numero(ap.dopo)}` : '—';
  const p = document.createElement('p');
  p.textContent = ap.n ? `Risposte giuste su ${testCorrente().length}, in media. Sono migliorati in ${ap.migliorati} su ${ap.n}.` : 'Il dato compare quando qualcuno ha completato ingresso e uscita.';
  cAp.append(v, p);
  griglia.appendChild(cAp);

  // Domande migliorate di più e di meno
  const variazioni = testCorrente().map((d, i) => {
    const a = corrette(d, 'ingresso').pct, b = corrette(d, 'uscita').pct;
    return { n: i + 1, d, v: a === null || b === null ? null : b - a };
  }).filter((x) => x.v !== null).sort((x, y) => y.v - x.v);
  const cVar = card('Domande del test', 'Variazione delle risposte corrette');
  if (variazioni.length) {
    const piu = variazioni[0], meno = variazioni[variazioni.length - 1];
    const a = document.createElement('p');
    a.textContent = `Migliorata di più: n. ${piu.n} (${piu.v > 0 ? '+' : ''}${piu.v} punti). ${piu.d.testo}`;
    const b = document.createElement('p');
    b.textContent = `Migliorata di meno: n. ${meno.n} (${meno.v > 0 ? '+' : ''}${meno.v} punti). ${meno.d.testo}`;
    cVar.append(a, b);
  } else {
    cVar.appendChild(Object.assign(document.createElement('p'), { textContent: 'Il dato compare dopo l’uscita.' }));
  }
  griglia.appendChild(cVar);

  // STEM nei mestieri
  const f = fascia();
  const si = corrette(f.mestieri, 'ingresso'), su = corrette(f.mestieri, 'uscita');
  const cS3 = card('Riconoscono le STEM in tutti i mestieri', `"${f.mestieri.testo}": tutti i mestieri giusti scelti`);
  cS3.append(
    coppia('Ingresso', si.pct, si.pct === null ? 'nessun dato' : `${si.pct}%`),
    coppia('Uscita', su.pct, su.pct === null ? 'nessun dato' : `${su.pct}%`)
  );
  const d3 = delta(si.pct, su.pct); if (d3) cS3.appendChild(d3);
  griglia.appendChild(cS3);

  // Primaria: scienza e tecnologia sono per tutti?
  if (f.percezione) {
    const pi = corrette(f.percezione, 'ingresso'), pu = corrette(f.percezione, 'uscita');
    const cP = card('Scienza e tecnologia sono per tutti', 'Hanno risposto "per tutti, maschi e femmine"');
    cP.append(
      coppia('Ingresso', pi.pct, pi.pct === null ? 'nessun dato' : `${pi.pct}%`),
      coppia('Uscita', pu.pct, pu.pct === null ? 'nessun dato' : `${pu.pct}%`)
    );
    const dp = delta(pi.pct, pu.pct); if (dp) cP.appendChild(dp);
    griglia.appendChild(cP);
  }

  // Interesse STEM
  const mi = media(valoriNumerici(f.interesse.id, 'ingresso')), mu = media(valoriNumerici(f.interesse.id, 'uscita'));
  const cS4 = card('Interesse per un lavoro STEM', `Media da 1 a ${f.scalaInteresse}`);
  cS4.append(
    coppia('Ingresso', mi === null ? null : (mi / f.scalaInteresse) * 100, numero(mi), false),
    coppia('Uscita', mu === null ? null : (mu / f.scalaInteresse) * 100, numero(mu), false)
  );
  const d4 = delta(mi, mu, 'punti'); if (d4) cS4.appendChild(d4);
  griglia.appendChild(cS4);

  // Gradimento
  const scala = f.gradimento.filter((d) => f.gradScala.includes(d.id));
  const gMedia = media(scala.flatMap((d) => valoriNumerici(d.id, 'uscita')));
  const cG = card('Gradimento', `Media delle domande a punteggio, da 1 a ${f.scalaGradimento}`);
  const vg = document.createElement('div'); vg.className = 'valore-grande'; vg.textContent = numero(gMedia);
  cG.appendChild(vg);
  scala.forEach((d) => {
    cG.appendChild(Object.assign(document.createElement('p'), { textContent: `${d.testo} ${numero(media(valoriNumerici(d.id, 'uscita')))}` }));
  });
  cG.appendChild(Object.assign(document.createElement('p'), {
    textContent: f.gradSi.map((g) => { const v = percentualeDi(g.id, 'uscita', 'si'); return `${g.etichetta}: ${v === null ? '—' : v + '%'} sì.`; }).join(' ')
  }));
  griglia.appendChild(cG);

  cont.appendChild(griglia);

  const azioni = document.createElement('div');
  azioni.className = 'azioni-sintesi';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn';
  b.textContent = 'Copia la scheda di sintesi';
  b.addEventListener('click', () => copiaSintesi(b));
  azioni.appendChild(b);
  cont.appendChild(azioni);
  cont.appendChild(nota('La scheda copiata ha già i dati del test, delle STEM e del gradimento: aggiungi il numero di maschi e femmine dal foglio firmato dal docente.'));
}

function testoSintesi() {
  const ti = corretteTest('ingresso'), tu = corretteTest('uscita');
  const ap = punteggiAppaiati();
  const variazioni = testCorrente().map((d, i) => {
    const a = corrette(d, 'ingresso').pct, b = corrette(d, 'uscita').pct;
    return { n: i + 1, v: a === null || b === null ? null : b - a };
  }).filter((x) => x.v !== null).sort((x, y) => y.v - x.v);
  const pct = (x) => (x === null ? '—' : x + '%');
  const f = fascia();
  const gMedia = media(f.gradimento.filter((d) => f.gradScala.includes(d.id)).flatMap((d) => valoriNumerici(d.id, 'uscita')));
  const aperte = f.gradimento.filter((d) => d.tipo === 'aperta').flatMap((d) => righeDi(d.id, 'uscita').map((r) => r.valore)).slice(0, 3);

  return [
    `Argomento: ${ARGOMENTI[sessione.scenario_corrente]?.etichetta || ''}`,
    `Scuola: ${sessione.scuola || ''}${sessione.classe ? ' · Classe ' + sessione.classe : ''}`,
    `Data: ${new Date(sessione.created_at).toLocaleDateString('it-IT')}`,
    'Studenti (dal foglio del docente): ___ totali, ___ maschi, ___ femmine',
    `Hanno risposto: ${partecipantiFase('ingresso')} all'ingresso, ${partecipantiFase('uscita')} all'uscita`,
    `Test, risposte corrette: ${pct(ti.pct)} in ingresso, ${pct(tu.pct)} in uscita`,
    ap.n ? `Stesse persone (${ap.n}): da ${numero(ap.prima)} a ${numero(ap.dopo)} risposte giuste su ${testCorrente().length}` : null,
    variazioni.length ? `Migliorata di più: domanda ${variazioni[0].n}; di meno: domanda ${variazioni[variazioni.length - 1].n}` : null,
    `STEM, tutti i mestieri riconosciuti: ${pct(corrette(f.mestieri, 'ingresso').pct)} in ingresso, ${pct(corrette(f.mestieri, 'uscita').pct)} in uscita`,
    f.percezione ? `Scienza e tecnologia "per tutti": ${pct(corrette(f.percezione, 'ingresso').pct)} in ingresso, ${pct(corrette(f.percezione, 'uscita').pct)} in uscita` : null,
    `STEM, interesse (1–${f.scalaInteresse}): ${numero(media(valoriNumerici(f.interesse.id, 'ingresso')))} in ingresso, ${numero(media(valoriNumerici(f.interesse.id, 'uscita')))} in uscita`,
    `Gradimento, media (1–${f.scalaGradimento}): ${numero(gMedia)}`,
    ...f.gradSi.map((g) => `${g.etichetta}: ${pct(percentualeDi(g.id, 'uscita', 'si'))} sì`),
    'Tre frasi:',
    ...aperte.map((t) => `- ${t}`)
  ].filter(Boolean).join('\n');
}

async function copiaSintesi(bottone) {
  const testo = testoSintesi();
  try {
    await navigator.clipboard.writeText(testo);
    bottone.textContent = 'Copiata!';
  } catch {
    window.prompt('Copia il testo qui sotto:', testo);
  }
  setTimeout(() => { bottone.textContent = 'Copia la scheda di sintesi'; }, 2000);
}

function vistaTest(cont) {
  const box = document.createElement('div');
  box.className = 'confronto';
  box.appendChild(Object.assign(nota('Percentuale di risposte corrette per ogni domanda del test, prima e dopo il laboratorio.'), { style: 'margin-top:0' }));
  testCorrente().forEach((d, i) => {
    const r = rigaConfronto(`${i + 1}. ${d.testo}`);
    const giusta = document.createElement('p');
    giusta.className = 'risposta-giusta';
    giusta.textContent = 'Risposta giusta: ' + d.opzioni.find((o) => o.id === d.corretta).testo;
    r.appendChild(giusta);
    const a = corrette(d, 'ingresso'), b = corrette(d, 'uscita');
    r.append(
      coppia('Ingresso', a.pct, a.pct === null ? 'nessun dato' : `${a.pct}% (${a.n} risp.)`),
      coppia('Uscita', b.pct, b.pct === null ? 'nessun dato' : `${b.pct}% (${b.n} risp.)`)
    );
    const dd = delta(a.pct, b.pct); if (dd) r.appendChild(dd);
    box.appendChild(r);
  });
  box.appendChild(nota('Con meno di 20 risposte per fase il dato va letto con cautela. La sintesi riporta anche il confronto sulle stesse persone.'));
  cont.appendChild(box);
}

function vistaStem(cont) {
  const griglia = document.createElement('div');
  griglia.className = 'griglia';
  const f = fascia();
  f.stemIngresso.forEach((d) => {
    griglia.appendChild(cardDistribuzione(d, 'ingresso'));
    if (f.stemUscita.includes(d)) griglia.appendChild(cardDistribuzione(d, 'uscita'));
  });
  cont.appendChild(griglia);
}

function vistaGradimento(cont) {
  const griglia = document.createElement('div');
  griglia.className = 'griglia';
  fascia().gradimento.filter((d) => d.tipo !== 'aperta').forEach((d) => griglia.appendChild(cardDistribuzione(d, 'uscita')));
  cont.appendChild(griglia);
}

function vistaAperte(cont) {
  const griglia = document.createElement('div');
  griglia.className = 'griglia';
  fascia().gradimento.filter((d) => d.tipo === 'aperta').forEach((d) => {
    const r = righeDi(d.id, 'uscita');
    const c = card(d.testo, `${r.length} risposte`);
    const ul = document.createElement('ul');
    ul.className = 'elenco-aperte';
    r.forEach((x) => { const li = document.createElement('li'); li.textContent = x.valore; ul.appendChild(li); });
    c.appendChild(ul);
    griglia.appendChild(c);
  });
  cont.appendChild(griglia);
}

function renderVista() {
  if (!sessione) return;
  const cont = el('contenuto-vista');
  cont.innerHTML = '';
  ({ sintesi: vistaSintesi, test: vistaTest, stem: vistaStem, gradimento: vistaGradimento, aperte: vistaAperte })[vista](cont);
}

async function aggiornaRisultati() {
  if (!sessione) return;
  const [{ data: partecipanti }, { data: risposte }] = await Promise.all([
    supabase.from('attivita_partecipanti').select('id, completed_at').eq('sessione_id', sessione.id),
    // Circa 27 righe per studente: si legge tutto paginando, oltre il limite di 1000 righe.
    leggiTutto(() => supabase.from('attivita_risposte_generiche').select('partecipante_id, scenario_id, tipo, valore').eq('sessione_id', sessione.id).order('created_at'))
      .then((data) => ({ data }), () => ({ data: [] }))
  ]);
  dati = { partecipanti: partecipanti || [], risposte: risposte || [] };

  const ingresso = partecipantiFase('ingresso');
  el('conteggio-ingresso').textContent = ingresso;
  el('conteggio-uscita').textContent = partecipantiFase('uscita');
  renderVista();

  if (!esplosaGia && ingresso > 0) { esplosaGia = true; esplosioneParticelle(); }
}

// ---------- esportazione dei dati ----------

/** Legge tutte le righe paginando: Supabase restituisce al massimo 1000 righe per richiesta. */
async function leggiTutto(costruisci) {
  const PAGINA = 1000;
  let righe = [], da = 0;
  for (;;) {
    const { data, error } = await costruisci().range(da, da + PAGINA - 1);
    if (error) throw error;
    righe = righe.concat(data || []);
    if (!data || data.length < PAGINA) return righe;
    da += PAGINA;
  }
}

const cellaCsv = (v) => {
  let t = v === null || v === undefined ? '' : String(v);
  // Le risposte aperte non devono diventare formule quando il file si apre in Excel.
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};

async function esportaCsv(bottone) {
  const testoOriginale = bottone.textContent;
  bottone.disabled = true;
  bottone.textContent = 'Preparo il file…';
  try {
    const sessioni = await leggiTutto(() => supabase.from('attivita_sessioni')
      .select('id, codice, scenario_corrente, contesto, scuola, classe, created_at')
      .eq('activity_key', ACTIVITY_KEY).order('created_at'));
    if (!sessioni.length) { alert('Non ci sono ancora dati da scaricare.'); return; }

    const perId = new Map(sessioni.map((x) => [x.id, x]));
    const ids = sessioni.map((x) => x.id);
    let risposte = [];
    for (let i = 0; i < ids.length; i += 100) {
      const blocco = ids.slice(i, i + 100);
      risposte = risposte.concat(await leggiTutto(() => supabase.from('attivita_risposte_generiche')
        .select('sessione_id, partecipante_id, scenario_id, tipo, valore, created_at')
        .in('sessione_id', blocco).order('created_at')));
    }

    const intestazione = ['data', 'codice_sessione', 'argomento', 'contesto', 'scuola', 'classe',
      'studente_anonimo', 'fase', 'sezione', 'id_domanda', 'domanda', 'risposta', 'risposta_testo', 'corretta'];

    const righe = risposte.map((r) => {
      const s = perId.get(r.sessione_id) || {};
      const d = tutteLeDomande(s.scenario_corrente).find((x) => x.id === r.scenario_id);
      const testo = d?.opzioni
        ? String(r.valore).split(',').map((id) => d.opzioni.find((o) => o.id === id)?.testo || id).join(' | ')
        : r.valore;
      const ok = d ? eCorretta(d, r.valore) : null;
      return [
        (s.created_at || '').slice(0, 10), s.codice, ARGOMENTI[s.scenario_corrente]?.etichetta || s.scenario_corrente,
        s.contesto, s.scuola, s.classe, r.partecipante_id.slice(0, 8), r.tipo, d?.sezione || '',
        r.scenario_id, d?.testo || '', r.valore, testo, ok === null ? '' : ok ? 'si' : 'no'
      ].map(cellaCsv).join(';');
    });

    // BOM e punto e virgola: Excel in italiano lo apre correttamente con un doppio clic.
    const contenuto = '﻿' + [intestazione.join(';'), ...righe].join('\r\n');
    const url = URL.createObjectURL(new Blob([contenuto], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `valutazione-mirafiori-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('Non sono riuscita a scaricare i dati. Riprova.');
  } finally {
    bottone.disabled = false;
    bottone.textContent = testoOriginale;
  }
}

// ---------- controlli ----------

function aggiornaProiezione() {
  const g = el('vista-risultati');
  g.classList.toggle('proiezione', proiezione);
  // Durante l'ingresso le risposte corrette restano nascoste in proiezione.
  const nascondi = proiezione && sessione?.fase === 'ingresso';
  g.classList.toggle('nascondi-corrette', nascondi);
  el('avviso-proiezione').classList.toggle('nascosto', !nascondi);
}

el('btn-crea').addEventListener('click', creaSessione);
el('btn-esporta').addEventListener('click', () => esportaCsv(el('btn-esporta')));
el('btn-esporta-config').addEventListener('click', () => esportaCsv(el('btn-esporta-config')));
el('campo-scuola').addEventListener('input', () => {
  el('errore-scuola').classList.add('nascosto');
  el('campo-scuola').classList.remove('errore');
});
el('btn-apri-ingresso').addEventListener('click', () => {
  if (sessione.fase === 'uscita' && !confirm('Tornare alle domande di ingresso? Chi sta rispondendo all\'uscita vedrà di nuovo le domande di ingresso.')) return;
  aggiornaSessione({ stato: 'running', fase: 'ingresso', started_at: sessione.started_at || new Date().toISOString() });
});
el('btn-apri-uscita').addEventListener('click', async () => {
  if (sessione.fase === 'ingresso' && !confirm('Aprire le domande di uscita? Le domande di ingresso si chiudono.')) return;
  aggiornaSessione({ stato: 'running', fase: 'uscita', started_at: sessione.started_at || new Date().toISOString() });
});
el('btn-chiudi').addEventListener('click', () => aggiornaSessione({ stato: 'locked' }));
el('btn-qr').addEventListener('click', () => {
  const nascosto = el('blocco-qr').classList.toggle('nascosto');
  el('btn-qr').textContent = nascosto ? 'Mostra QR' : 'Nascondi QR';
});
el('btn-proietta').addEventListener('click', () => {
  proiezione = !proiezione;
  aggiornaProiezione();
  el('btn-proietta').textContent = proiezione ? 'Esci dalla proiezione' : 'Modalità proiezione';
});
el('btn-termina').addEventListener('click', async () => {
  if (!confirm('Terminare la sessione? Gli studenti non potranno più rispondere. I dati restano salvati.')) return;
  await aggiornaSessione({ stato: 'completed', ended_at: new Date().toISOString() });
  localStorage.removeItem(CHIAVE_SESSIONE);
});
el('btn-reset').addEventListener('click', async () => {
  if (!confirm('Cancellare definitivamente questa sessione e tutte le sue risposte?')) return;
  await supabase.from('attivita_sessioni').delete().eq('id', sessione.id);
  localStorage.removeItem(CHIAVE_SESSIONE);
  if (canale) supabase.removeChannel(canale);
  sessione = null;
  el('blocco-sessione').classList.add('nascosto');
  el('blocco-configura').classList.remove('nascosto');
  caricaScuoleNote();
});

document.querySelectorAll('#tab-barra .tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('#tab-barra .tab').forEach((x) => x.classList.toggle('attivo', x === t));
    vista = t.dataset.tab;
    renderVista();
  });
});

pulsantiScelta('scelta-argomento', ARGOMENTI, 'argomento');
pulsantiScelta('scelta-contesto', CONTESTI, 'contesto');
aggiornaRiepilogo();
aggiornaCampoScuola();
caricaScuoleNote();
riprendiSessione();
