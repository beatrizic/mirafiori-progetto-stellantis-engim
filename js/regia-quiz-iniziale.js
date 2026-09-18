import { supabase } from './supabase-client.js';
import { esplosioneParticelle } from './particelle.js';

const DOMANDE = [1,2,3,4,5,6,7,8,9,10].map((n) => `qi-q${n}`);
const griglia = document.getElementById('griglia-risultati');
const statoMasterEl = document.getElementById('stato-master');
const conteggioEl = document.getElementById('conteggio-risposte');
let esplosaGia = false;

// QR dinamico
const qrEl = document.getElementById('qr-quiz');
// eslint-disable-next-line no-undef
new QRCode(qrEl, { text: qrEl.dataset.urlQuiz, width: 200, height: 200, colorDark: '#0e2a52', colorLight: '#ffffff' });

async function caricaDomandeEDisegnaScheletro() {
  const { data, error } = await supabase.from('sessioni').select('sessione_id, domanda, opzioni').in('sessione_id', [...DOMANDE, 'qi-checkbox']);
  if (error) { console.error('Errore caricamento domande:', error); return; }
  const ordinate = [...DOMANDE, 'qi-checkbox'].map((id) => data.find((d) => d.sessione_id === id)).filter(Boolean);
  if (ordinate.length < DOMANDE.length + 1) {
    console.warn('Attenzione: mancano domande nel database. Trovate', ordinate.length, 'su', DOMANDE.length + 1);
  }
  griglia.innerHTML = '';
  ordinate.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'card-domanda' + (d.sessione_id === 'qi-checkbox' ? ' card-checkbox' : '');
    card.dataset.sessione = d.sessione_id;
    const titolo = document.createElement('h3');
    titolo.textContent = d.domanda;
    const barre = document.createElement('div');
    barre.className = 'barre';
    barre.dataset.opzioni = JSON.stringify(d.opzioni); // assegnato via proprietà DOM: nessun problema di apici/virgolette
    card.appendChild(titolo);
    card.appendChild(barre);
    griglia.appendChild(card);
  });
}

async function aggiornaRisultati() {
  const { data: voti, error } = await supabase.from('voti').select('sessione_id, opzione').in('sessione_id', [...DOMANDE, 'qi-checkbox']);
  if (error) { console.error('Errore caricamento risposte:', error); return; }
  conteggioEl.textContent = Math.round(voti.length / 11); // 11 righe per risposta completa

  document.querySelectorAll('.card-domanda').forEach((card) => {
    try {
      const sessioneId = card.dataset.sessione;
      const barreDiv = card.querySelector('.barre');
      const opzioni = JSON.parse(barreDiv.dataset.opzioni);
      const votiDomanda = voti.filter((v) => v.sessione_id === sessioneId);
      const totale = votiDomanda.length || 1;
      barreDiv.innerHTML = opzioni.map((op) => {
        const n = votiDomanda.filter((v) => v.opzione === op).length;
        const perc = Math.round((n / totale) * 100);
        return `
          <div class="barra-risultato-r">
            <div class="etichetta-riga-r"><span>${op}</span><span>${perc}% (${n})</span></div>
            <div class="barra-contenitore-r"><div class="barra-riempimento-r" style="width:${perc}%"></div></div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error('Errore nel render della card', card.dataset.sessione, e);
    }
  });

  if (!esplosaGia && voti.length > 0) {
    esplosaGia = true;
    esplosioneParticelle();
  }
}

async function sincronizzaMaster() {
  const { data } = await supabase.from('sessioni').select('stato').eq('sessione_id', 'qi-master').single();
  const stato = data?.stato || 'chiusa';
  statoMasterEl.textContent = stato;
  document.getElementById('btn-apri-quiz').disabled = stato === 'aperta';
  document.getElementById('btn-chiudi-quiz').disabled = stato === 'chiusa';
}

document.getElementById('btn-apri-quiz').addEventListener('click', async () => {
  await supabase.from('sessioni').update({ stato: 'aperta' }).eq('sessione_id', 'qi-master');
  sincronizzaMaster();
});
document.getElementById('btn-chiudi-quiz').addEventListener('click', async () => {
  await supabase.from('sessioni').update({ stato: 'chiusa' }).eq('sessione_id', 'qi-master');
  sincronizzaMaster();
});

await caricaDomandeEDisegnaScheletro();
await sincronizzaMaster();
await aggiornaRisultati();

supabase
  .channel('qi-voti-live')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voti' }, aggiornaRisultati)
  .subscribe();

setInterval(aggiornaRisultati, 8000); // rete di sicurezza se il realtime perde un evento
