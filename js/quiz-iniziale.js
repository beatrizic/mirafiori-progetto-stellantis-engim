import { supabase } from './supabase-client.js';
import { ACTIVITY_KEY, ACCETTAZIONE, domandePer } from './quiz-dati.js';
import { generaAnonymousId } from './attivita-logica.js';

const CHIAVE_ANON = 'mirafiori_anon_id';

const el = (id) => document.getElementById(id);
let sessione = null;
let partecipante = null;
let domande = [];
let inviato = false;

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
  domande = domandePer(sessione.contesto || 'esterna', sessione.momento || 'iniziale');
  await sincronizza();

  supabase.channel('sessione-quiz-' + sessione.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attivita_sessioni', filter: 'id=eq.' + sessione.id },
      async (p) => { sessione = p.new; if (!inviato) await sincronizza(); })
    .subscribe();
}

async function sincronizza() {
  if (sessione.stato === 'waiting')   { messaggio('Aspetta il via', 'Il quiz non è ancora aperto. Questa pagina si aggiorna da sola.'); return; }
  if (sessione.stato === 'completed') { messaggio('Quiz chiuso', 'Questo quiz è terminato.'); return; }

  if (!partecipante && !(await registraPartecipante())) return;

  if (inviato) { mostra('schermo-grazie'); return; }
  if (sessione.stato === 'locked') { messaggio('Risposte chiuse', 'Il quiz è stato chiuso.'); return; }

  if (!el('contenitore-domande').childElementCount) costruisciForm();
  mostra('form-quiz');
}

async function registraPartecipante() {
  const anonymous = anonId();
  const { data: esistente } = await supabase
    .from('attivita_partecipanti').select('*')
    .eq('sessione_id', sessione.id).eq('anonymous_id', anonymous).maybeSingle();

  if (esistente) {
    partecipante = esistente;
    inviato = !!esistente.completed_at;   // ha già inviato: non può rifarlo
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

// ---------- form ----------

function gruppoRadio(nome, opzioni, classe) {
  const box = document.createDocumentFragment();
  opzioni.forEach((o) => {
    const label = document.createElement('label');
    label.className = classe;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = nome;
    input.value = o.id;
    const span = document.createElement('span');
    span.textContent = o.testo;
    label.append(input, span);
    box.appendChild(label);
  });
  return box;
}

function costruisciForm() {
  el('titolo-quiz').textContent = sessione.momento === 'finale' ? 'Quiz finale' : 'Quiz iniziale';

  const cont = el('contenitore-domande');
  cont.innerHTML = '';
  domande.forEach((d, i) => {
    const blocco = document.createElement('div');
    blocco.className = 'domanda-quiz';
    blocco.id = 'blocco-' + d.id;

    const fs = document.createElement('fieldset');
    const legend = document.createElement('legend');
    const n = document.createElement('span');
    n.className = 'numero-domanda';
    n.textContent = (i + 1) + '.';
    legend.append(n, document.createTextNode(d.testo));

    const opz = document.createElement('div');
    opz.className = 'opzioni-radio';
    opz.appendChild(gruppoRadio(d.id, d.opzioni, 'opzione-radio'));

    fs.append(legend, opz);
    blocco.appendChild(fs);
    cont.appendChild(blocco);
  });

  el('testo-accettazione').textContent = ACCETTAZIONE.testo;
  const acc = el('opzioni-accettazione');
  acc.innerHTML = '';
  acc.appendChild(gruppoRadio(ACCETTAZIONE.id, ACCETTAZIONE.opzioni, 'opzione-acc'));
}

el('form-quiz').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (inviato) return;

  const form = el('form-quiz');
  const scelta = (nome) => form.querySelector(`input[name="${nome}"]:checked`)?.value || null;

  // Controllo che tutte le domande abbiano una risposta.
  const mancanti = domande.map((d, i) => (scelta(d.id) ? null : i + 1)).filter(Boolean);
  if (!scelta(ACCETTAZIONE.id)) mancanti.push('il riquadro rosso in fondo');

  const avviso = el('avviso-mancanti');
  if (mancanti.length) {
    avviso.textContent = 'Manca la risposta a: ' + mancanti.join(', ') + '.';
    avviso.classList.remove('nascosto');
    const primo = domande.find((d) => !scelta(d.id));
    if (primo) el('blocco-' + primo.id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  avviso.classList.add('nascosto');

  const btn = el('btn-invia');
  btn.disabled = true;
  btn.textContent = 'Invio in corso…';

  const righe = [...domande.map((d) => ({ id: d.id, valore: scelta(d.id) })), { id: ACCETTAZIONE.id, valore: scelta(ACCETTAZIONE.id) }]
    .map((r) => ({
      sessione_id: sessione.id,
      partecipante_id: partecipante.id,
      activity_key: ACTIVITY_KEY,
      scenario_id: r.id,
      tipo: 'risposta',
      valore: r.valore
    }));

  const { error } = await supabase.from('attivita_risposte_generiche').insert(righe);

  // 23505 = risposte già inviate da questo dispositivo: le trattiamo come registrate.
  if (error && error.code !== '23505') {
    btn.disabled = false;
    btn.textContent = 'Invio non riuscito. Riprova';
    return;
  }

  await supabase.from('attivita_partecipanti')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', partecipante.id);

  inviato = true;
  mostra('schermo-grazie');
});

window.addEventListener('unhandledrejection', () => {
  if (!el('schermo-stato').classList.contains('nascosto')) {
    messaggio('Connessione persa', 'Controlla la rete e ricarica la pagina.', true);
  }
});

avvia();
