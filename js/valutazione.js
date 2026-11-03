import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, ARGOMENTI, MAX_APERTA, domandePer } from './valutazione-dati.js';
import { generaAnonymousId } from './attivita-logica.js';

// A differenza delle altre attività, l'id anonimo resta in localStorage
// (legato al codice della sessione): serve ad abbinare ingresso e uscita
// dello stesso telefono anche se nel frattempo la scheda è stata chiusa.
const chiaveAnon = (codice) => 'mirafiori_valutazione_' + codice;

const el = (id) => document.getElementById(id);
let sessione = null;
let partecipante = null;
let domande = [];
let faseForm = null;        // la fase per cui è costruito il form
const inviate = new Set();  // fasi già inviate da questo dispositivo

function mostra(id) {
  ['schermo-stato', 'form-quiz', 'schermo-grazie'].forEach((x) => el(x).classList.add('nascosto'));
  el(id).classList.remove('nascosto');
}

function messaggio(titolo, testo, errore = false) {
  el('stato-titolo').textContent = titolo;
  el('stato-testo').textContent = testo;
  el('stato-testo').className = errore ? 'avviso' : 'grigio';
  mostra('schermo-stato');
}

function anonId() {
  const chiave = chiaveAnon(sessione.codice);
  let id = null;
  try { id = localStorage.getItem(chiave); } catch { /* archiviazione non disponibile */ }
  if (!id) {
    id = generaAnonymousId();
    try { localStorage.setItem(chiave, id); } catch { /* resta valido per questa visita */ }
  }
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

  supabase.channel('sessione-valutazione-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  const fase = sessione.fase;
  if (sessione.stato === 'waiting')   { messaggio('Aspetta il via', 'Le domande non sono ancora aperte. Questa pagina si aggiorna da sola.'); return; }
  if (sessione.stato === 'completed') { messaggio('Valutazione chiusa', 'Questa valutazione è terminata. Grazie!'); return; }

  if (!partecipante && !(await registraPartecipante())) return;

  if (inviate.has(fase)) { mostraGrazie(fase); return; }
  if (sessione.stato === 'locked') {
    messaggio('Risposte chiuse', fase === 'ingresso'
      ? 'Le domande di ingresso sono chiuse. Alla fine del laboratorio questa pagina si riaprirà da sola.'
      : 'Le domande sono state chiuse.');
    return;
  }

  // Il form si ricostruisce solo quando cambia la fase: chi sta rispondendo non perde niente.
  if (faseForm !== fase) costruisciForm(fase);
  mostra('form-quiz');
}

async function registraPartecipante() {
  const anonymous = anonId();
  const { data: esistente } = await supabase
    .from('attivita_partecipanti').select('*')
    .eq('sessione_id', sessione.id).eq('anonymous_id', anonymous).maybeSingle();

  if (esistente) {
    partecipante = esistente;
    // Quali fasi ha già inviato questo dispositivo.
    const { data: righe } = await supabase
      .from('attivita_risposte_generiche').select('tipo')
      .eq('sessione_id', sessione.id).eq('partecipante_id', partecipante.id);
    (righe || []).forEach((r) => inviate.add(r.tipo));
    return true;
  }

  const { data, error } = await supabase
    .from('attivita_partecipanti')
    .insert({ sessione_id: sessione.id, anonymous_id: anonymous })
    .select().single();

  if (error) { messaggio('Connessione non riuscita', 'Prova a ricaricare la pagina.', true); return false; }
  partecipante = data;
  return true;
}

function mostraGrazie(fase) {
  if (fase === 'ingresso') {
    el('grazie-titolo').textContent = 'Grazie, ci vediamo alla fine!';
    el('grazie-testo').textContent = 'Le tue risposte sono registrate. Tieni aperta questa pagina: alla fine del laboratorio si riapre da sola per le ultime domande.';
  } else {
    el('grazie-titolo').textContent = 'Grazie!';
    el('grazie-testo').textContent = 'Le tue risposte sono state registrate. Ultima cosa: prendi un post-it e scrivi la cosa più importante che ti porti a casa da oggi.';
  }
  mostra('schermo-grazie');
}

// ---------- form ----------

const SEZIONI = { stem: 'Le STEM', test: 'Il test', gradimento: 'Il laboratorio', te: 'Su di te' };

function gruppoOpzioni(d) {
  const box = document.createDocumentFragment();
  const tipoInput = d.tipo === 'multipla' ? 'checkbox' : 'radio';
  d.opzioni.forEach((o) => {
    const label = document.createElement('label');
    label.className = 'opzione-radio';
    const input = document.createElement('input');
    input.type = tipoInput;
    input.name = d.id;
    input.value = o.id;
    if (o.esclusiva) input.dataset.esclusiva = 'si';
    const span = document.createElement('span');
    span.textContent = o.testo;
    label.append(input, span);
    box.appendChild(label);
  });
  return box;
}

function intestazione(d, numero, contenitore) {
  const n = document.createElement('span');
  n.className = 'numero-domanda';
  n.textContent = numero + '.';
  contenitore.append(n, document.createTextNode(d.testo));
  const aiuto = d.aiuto || (d.facoltativa ? 'Domanda facoltativa.' : '');
  if (aiuto) {
    const a = document.createElement('span');
    a.className = 'aiuto-domanda';
    a.textContent = aiuto;
    contenitore.appendChild(a);
  }
}

function bloccoDomanda(d, numero) {
  const blocco = document.createElement('div');
  blocco.className = 'domanda-quiz';
  blocco.id = 'blocco-' + d.id;

  if (d.tipo === 'aperta') {
    const label = document.createElement('label');
    label.className = 'legenda';
    label.htmlFor = 'campo-' + d.id;
    intestazione(d, numero, label);
    const area = document.createElement('textarea');
    area.className = 'campo-aperto';
    area.id = 'campo-' + d.id;
    area.name = d.id;
    area.maxLength = MAX_APERTA;
    const conta = document.createElement('span');
    conta.className = 'conta-caratteri';
    conta.textContent = `0 / ${MAX_APERTA}`;
    area.addEventListener('input', () => { conta.textContent = `${area.value.length} / ${MAX_APERTA}`; });
    blocco.append(label, area, conta);
    return blocco;
  }

  const fs = document.createElement('fieldset');
  const legend = document.createElement('legend');
  intestazione(d, numero, legend);
  const opz = document.createElement('div');
  opz.className = 'opzioni-radio';
  opz.appendChild(gruppoOpzioni(d));
  fs.append(legend, opz);
  blocco.appendChild(fs);
  return blocco;
}

function costruisciForm(fase) {
  faseForm = fase;
  domande = domandePer(sessione.scenario_corrente, fase, !!sessione.risultati_visibili);
  const argomento = ARGOMENTI[sessione.scenario_corrente]?.etichetta || '';

  el('titolo-quiz').textContent = fase === 'ingresso' ? 'Prima di cominciare' : 'Per finire';
  const intro = el('intro-quiz');
  intro.textContent = (fase === 'ingresso'
    ? `${argomento}: qualche domanda per capire da dove partiamo. Non è una verifica e non c'è voto.`
    : `${argomento}: rifai il test di inizio e dicci com'è andata. Non è una verifica e non c'è voto.`)
    + ' Le risposte sono completamente anonime: nessun nome, nessun dato personale. ';
  const link = document.createElement('a');
  link.href = 'privacy.html';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Come usiamo i dati';
  intro.appendChild(link);

  const cont = el('contenitore-domande');
  cont.innerHTML = '';
  let sezione = null;
  domande.forEach((d, i) => {
    if (d.sezione !== sezione) {
      sezione = d.sezione;
      const h = document.createElement('h2');
      h.className = 'titolo-sezione';
      h.textContent = SEZIONI[sezione];
      cont.appendChild(h);
    }
    cont.appendChild(bloccoDomanda(d, i + 1));
  });

  el('avviso-mancanti').classList.add('nascosto');
  const btn = el('btn-invia');
  btn.disabled = false;
  btn.textContent = 'Invia le risposte';
}

// "Nessuno di questi" esclude le altre scelte, e viceversa.
el('contenitore-domande').addEventListener('change', (e) => {
  const input = e.target;
  if (input.type !== 'checkbox' || !input.checked) return;
  const gruppo = el('form-quiz').querySelectorAll(`input[name="${input.name}"]`);
  gruppo.forEach((x) => {
    if (x === input) return;
    if (input.dataset.esclusiva || x.dataset.esclusiva) x.checked = false;
  });
});

function valoreDi(d) {
  const form = el('form-quiz');
  if (d.tipo === 'aperta') {
    const t = (form.querySelector(`[name="${d.id}"]`)?.value || '').replace(/\s+/g, ' ').trim();
    return t ? t.slice(0, MAX_APERTA) : null;
  }
  if (d.tipo === 'multipla') {
    const scelte = [...form.querySelectorAll(`input[name="${d.id}"]:checked`)].map((x) => x.value);
    return scelte.length ? scelte.join(',') : null;
  }
  return form.querySelector(`input[name="${d.id}"]:checked`)?.value || null;
}

el('form-quiz').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fase = faseForm;
  if (inviate.has(fase)) return;

  const valori = domande.map((d) => ({ d, valore: valoreDi(d) }));

  // Controllo che tutte le domande obbligatorie abbiano una risposta.
  const mancanti = valori.map((v, i) => (v.valore || v.d.facoltativa ? null : i + 1)).filter(Boolean);
  const avviso = el('avviso-mancanti');
  if (mancanti.length) {
    avviso.textContent = 'Manca la risposta a: ' + mancanti.join(', ') + '.';
    avviso.classList.remove('nascosto');
    el('blocco-' + domande[mancanti[0] - 1].id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  avviso.classList.add('nascosto');

  const btn = el('btn-invia');
  btn.disabled = true;
  btn.textContent = 'Invio in corso…';

  const righe = valori.filter((v) => v.valore).map((v) => ({
    sessione_id: sessione.id,
    partecipante_id: partecipante.id,
    activity_key: ACTIVITY_KEY,
    scenario_id: v.d.id,
    tipo: fase,
    valore: v.valore
  }));

  const { error } = await supabase.from('attivita_risposte_generiche').insert(righe);

  // 23505 = risposte già inviate da questo dispositivo: le trattiamo come registrate.
  if (error && error.code !== '23505') {
    btn.disabled = false;
    btn.textContent = 'Invio non riuscito. Riprova';
    return;
  }

  if (fase === 'uscita') {
    await supabase.from('attivita_partecipanti')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', partecipante.id);
  }

  inviate.add(fase);
  window.scrollTo(0, 0);
  mostraGrazie(fase);
});

window.addEventListener('unhandledrejection', () => {
  if (!el('schermo-stato').classList.contains('nascosto')) {
    messaggio('Connessione persa', 'Controlla la rete e ricarica la pagina.', true);
  }
});

avvia();
