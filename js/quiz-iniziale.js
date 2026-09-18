import { supabase, giaCompletato, segnaCompletato } from './supabase-client.js';

const CHIAVE_COMPLETATO = 'mirafiori_quiz_iniziale_completato';
const DOMANDE = [1,2,3,4,5,6,7,8,9,10].map((n) => `qi-q${n}`);

const schermoAttesa = document.getElementById('schermo-attesa');
const schermoGrazie = document.getElementById('schermo-grazie');
const form = document.getElementById('form-quiz');
const contenitoreDomande = document.getElementById('contenitore-domande');

function mostra(el) {
  [schermoAttesa, schermoGrazie, form].forEach((e) => e.classList.add('nascosto'));
  el.classList.remove('nascosto');
}

async function caricaDomande() {
  const { data } = await supabase.from('sessioni').select('sessione_id, domanda, opzioni').in('sessione_id', DOMANDE);
  const ordinate = DOMANDE.map((id) => data.find((d) => d.sessione_id === id)).filter(Boolean);
  contenitoreDomande.innerHTML = '';
  ordinate.forEach((d, i) => {
    const blocco = document.createElement('div');
    blocco.className = 'domanda-quiz';
    const opzioniHtml = d.opzioni.map((op, j) => `
      <label class="opzione-radio">
        <input type="radio" name="${d.sessione_id}" value="${op}" required>
        <span>${op}</span>
      </label>
    `).join('');
    blocco.innerHTML = `<p class="testo-domanda">${i + 1}. ${d.domanda}</p><div class="opzioni-radio">${opzioniHtml}</div>`;
    contenitoreDomande.appendChild(blocco);
  });
}

async function sincronizza() {
  if (giaCompletato(CHIAVE_COMPLETATO)) { mostra(schermoGrazie); return; }
  const { data } = await supabase.from('sessioni').select('stato').eq('sessione_id', 'qi-master').single();
  if (data?.stato === 'aperta') {
    if (!contenitoreDomande.childElementCount) await caricaDomande();
    mostra(form);
  } else {
    mostra(schermoAttesa);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const righe = DOMANDE.map((id) => {
    const scelto = form.querySelector(`input[name="${id}"]:checked`);
    return { sessione_id: id, opzione: scelto ? scelto.value : null };
  });
  righe.push({ sessione_id: 'qi-checkbox', opzione: form.querySelector('input[name="qi-checkbox"]:checked')?.value || null });

  const pulsante = form.querySelector('.btn-invia');
  pulsante.disabled = true;
  pulsante.textContent = 'Invio in corso…';

  const { error } = await supabase.from('voti').insert(righe);
  if (error) {
    pulsante.disabled = false;
    pulsante.textContent = 'Invia le risposte';
    alert('Errore di invio, riprova.');
    return;
  }
  segnaCompletato(CHIAVE_COMPLETATO);
  mostra(schermoGrazie);
});

await sincronizza();

supabase
  .channel('qi-master-stato')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessioni', filter: 'sessione_id=eq.qi-master' }, sincronizza)
  .subscribe();
