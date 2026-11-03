// ============================================================
//  VALUTAZIONE DEI LABORATORI
//
//  Una sessione per classe e per argomento, in due fasi:
//    ingresso: le STEM (S1–S4) + il test sull'argomento (T1–T6)
//    uscita:   lo stesso test + S3 e S4 + il gradimento (G1–G8, G9 facoltativa)
//
//  Dove stanno i dati nella sessione (tabella attivita_sessioni):
//    scenario_corrente   = argomento ('citizenship' | 'cloud' | 'printing' | 'ia')
//    fase                = 'ingresso' | 'uscita'
//    risultati_visibili  = true se la domanda facoltativa sul genere è attiva
//  Nelle risposte, tipo = fase: così ingresso e uscita della stessa
//  domanda convivono per lo stesso studente.
//
//  Gli ID delle domande non vanno mai cambiati: sono la chiave
//  del confronto prima / dopo. Stesse domande del PDF
//  "Valutazione dei laboratori".
// ============================================================

export const ACTIVITY_KEY = 'valutazione-lab';

export const CONTESTI = {
  esterna: { id: 'esterna', etichetta: 'Scuola esterna' },
  engim:   { id: 'engim',   etichetta: 'ENGIM' }
};

export const FASI = {
  ingresso: { id: 'ingresso', etichetta: 'Ingresso' },
  uscita:   { id: 'uscita',   etichetta: 'Uscita' }
};

export const ARGOMENTI = {
  citizenship: { id: 'citizenship', etichetta: 'Digital Citizenship' },
  cloud:       { id: 'cloud',       etichetta: 'Cloud' },
  printing:    { id: 'printing',    etichetta: 'Digital Printing' },
  ia:          { id: 'ia',          etichetta: 'Intelligenza Artificiale' }
};

const SCALA = (etichette) => etichette.map((t, i) => ({ id: String(i + 1), testo: `${i + 1} · ${t}` }));
const SI_FORSE_NO = [{ id: 'si', testo: 'Sì' }, { id: 'forse', testo: 'Forse' }, { id: 'no', testo: 'No' }];
const abc = (a, b, c) => [{ id: 'a', testo: a }, { id: 'b', testo: b }, { id: 'c', testo: c }];

// ---------- Parte 1 · le STEM ----------
// tipo: 'singola' | 'multipla' | 'scala' | 'aperta'
// corretta: id (singola) oppure elenco di id (multipla: giusta solo se coincide esattamente)

export const STEM = {
  s1: {
    id: 's1', tipo: 'singola', sezione: 'stem',
    testo: 'Cosa significa la sigla STEM?',
    opzioni: abc('Scienza, Tecnologia, Ingegneria, Matematica', 'Studio, Tecnica, Economia, Musica', 'Scienze, Teatro, Educazione fisica, Media'),
    corretta: 'a'
  },
  s2: {
    id: 's2', tipo: 'multipla', sezione: 'stem',
    testo: 'Quali di queste materie sono STEM?',
    aiuto: 'Puoi sceglierne più di una.',
    opzioni: [
      { id: 'matematica', testo: 'Matematica' },
      { id: 'informatica', testo: 'Informatica' },
      { id: 'italiano', testo: 'Italiano' },
      { id: 'fisica', testo: 'Fisica' },
      { id: 'storia', testo: 'Storia' },
      { id: 'chimica', testo: 'Chimica' },
      { id: 'disegno', testo: 'Disegno tecnico' },
      { id: 'inglese', testo: 'Inglese' }
    ],
    corretta: ['matematica', 'informatica', 'fisica', 'chimica', 'disegno']
  },
  s3: {
    id: 's3', tipo: 'multipla', sezione: 'stem',
    testo: 'Quali di questi mestieri usano competenze STEM?',
    aiuto: 'Puoi sceglierne più di uno.',
    opzioni: [
      { id: 'parrucchiere', testo: 'Parrucchiere o parrucchiera' },
      { id: 'cuoco', testo: 'Cuoco o cuoca' },
      { id: 'estetista', testo: 'Estetista' },
      { id: 'meccanico', testo: 'Meccanico o meccanica' },
      { id: 'programmatore', testo: 'Programmatore o programmatrice' },
      { id: 'nessuno', testo: 'Nessuno di questi', esclusiva: true }
    ],
    corretta: ['parrucchiere', 'cuoco', 'estetista', 'meccanico', 'programmatore']
  },
  s4: {
    id: 's4', tipo: 'scala', sezione: 'stem',
    testo: 'Ti piacerebbe fare un lavoro in ambito STEM?',
    opzioni: SCALA(['per niente', 'poco', 'non so', 'abbastanza', 'molto'])
  }
};

// ---------- Parte 2 · il test sull'argomento ----------

const t = (id, testo, opzioni, corretta) => ({ id, tipo: 'singola', sezione: 'test', testo, opzioni, corretta });

export const TEST = {
  citizenship: [
    t('t1', 'Cosa sono i metadati di una foto?', abc('I filtri applicati', 'I like ricevuti', 'Dati nascosti come luogo, data e telefono'), 'c'),
    t('t2', 'Il diritto all’oblio permette di…', abc('Far togliere una notizia dai risultati di ricerca sul proprio nome', 'Cancellare una notizia da internet', 'Denunciare chi l’ha scritta'), 'a'),
    t('t3', 'Inoltrare in un gruppo un’immagine intima di un’altra persona, senza il suo consenso…', abc('È lecito se non l’hai scattata tu', 'Può essere un reato anche se l’hai solo ricevuta', 'È vietato solo ai minorenni'), 'b'),
    t('t4', 'Un SMS ti chiede di pagare 1,99 € per un pacco in giacenza tramite un link. È…', abc('Probabilmente phishing', 'Un servizio normale dei corrieri', 'Sicuro se il link è corto'), 'a'),
    t('t5', 'Un’azienda, durante un colloquio, può chiederti la password dei tuoi social?', abc('Sì, se il lavoro riguarda i social', 'Sì, se il profilo è privato', 'No, mai'), 'c'),
    t('t6', 'Avere il profilo privato significa che…', abc('Nessuno può vedere niente di te', 'Nome e foto profilo possono restare visibili', 'Google non ti trova più'), 'b')
  ],
  cloud: [
    t('t1', 'Il cloud è…', abc('Il computer di qualcun altro', 'Una memoria dentro il telefono', 'Una rete di satelliti'), 'a'),
    t('t2', 'Una foto caricata su un servizio cloud gratuito è…', abc('Proprietà dell’azienda', 'Tua, con una licenza d’uso all’azienda', 'Pubblica'), 'b'),
    t('t3', 'La regola del 3-2-1 dice di avere…', abc('3 password, 2 account, 1 telefono', '3 foto per cartella, 2 cartelle, 1 backup', '3 copie dei dati, su 2 supporti diversi, 1 fuori casa'), 'c'),
    t('t4', 'Cosa rende più robusta una password?', abc('La lunghezza', 'Il nome del proprio animale', 'Un solo simbolo speciale'), 'a'),
    t('t5', 'La verifica in due passaggi serve a…', abc('Fare il backup due volte', 'Impedire l’accesso anche a chi ha rubato la password', 'Ricordare la password'), 'b'),
    t('t6', 'Il principio del minimo privilegio dice che…', abc('Tutti devono poter modificare tutto', 'Il proprietario non può modificare', 'Ognuno ha solo i permessi che gli servono'), 'c')
  ],
  printing: [
    t('t1', 'In che ordine si passa per stampare un oggetto in 3D?', abc('Stampa, modello, slicer', 'Modello, slicer, stampa', 'Slicer, stampa, modello'), 'b'),
    t('t2', 'A cosa serve lo slicer?', abc('A tagliare il modello in strati e calcolare tempo e materiale', 'A pulire l’ugello', 'A disegnare l’oggetto'), 'a'),
    t('t3', 'Nella stampa 3D da tavolo, cosa costa di più?', abc('Il materiale', 'Il file', 'Il tempo macchina'), 'c'),
    t('t4', 'Una parte che sporge nel vuoto oltre i 45 gradi…', abc('Si stampa sempre senza problemi', 'Ha bisogno di supporti o di un’altra orientazione', 'Non si può mai stampare'), 'b'),
    t('t5', 'Per produrre 100.000 pezzi uguali conviene…', abc('Uno stampo', 'La stampa 3D', 'È indifferente'), 'a'),
    t('t6', 'Un modello 3D scaricato gratis con licenza CC BY-NC si può…', abc('Vendere liberamente', 'Stampare per sé, ma non vendere', 'Solo guardare'), 'b')
  ],
  ia: [
    t('t1', 'Un’IA come ChatGPT, quando risponde…', abc('Cerca la risposta esatta in un archivio', 'Sceglie le parole più probabili, una dopo l’altra', 'Chiede a una persona'), 'b'),
    t('t2', 'Cos’è un’allucinazione dell’IA?', abc('Un’immagine generata', 'Un errore del telefono', 'Una risposta inventata ma scritta con sicurezza'), 'c'),
    t('t3', 'Le quattro parti di un buon prompt sono…', abc('Ruolo, contesto, compito, formato', 'Saluto, domanda, grazie, firma', 'Titolo, testo, immagine, link'), 'a'),
    t('t4', 'Perché un’IA può ripetere stereotipi?', abc('Perché è programmata per farlo', 'Perché li ha imparati dai dati del passato', 'Non può farlo'), 'b'),
    t('t5', 'Come si verifica un’immagine sospetta?', abc('Guardandola con attenzione', 'Chiedendo a un’IA', 'Con la ricerca inversa e cercando chi l’ha pubblicata per primo'), 'c'),
    t('t6', 'Secondo l’AI Act europeo, un’IA che seleziona i curriculum…', abc('È vietata', 'È ad alto rischio e serve il controllo di una persona', 'Non ha regole'), 'b')
  ]
};

// ---------- Parte 3 · il gradimento ----------

export const GRADIMENTO = [
  { id: 'g1', tipo: 'scala', sezione: 'gradimento', testo: 'Quanto ti è piaciuto il laboratorio?', opzioni: SCALA(['per niente', 'poco', 'così così', 'abbastanza', 'molto']) },
  { id: 'g2', tipo: 'scala', sezione: 'gradimento', testo: 'Quanto ti sarà utile nella vita di tutti i giorni?', opzioni: SCALA(['per niente', 'poco', 'non so', 'abbastanza', 'molto']) },
  { id: 'g3', tipo: 'scala', sezione: 'gradimento', testo: 'La spiegazione è stata chiara?', opzioni: SCALA(['per niente', 'poco', 'in parte', 'abbastanza', 'molto']) },
  { id: 'g4', tipo: 'scala', sezione: 'gradimento', testo: 'I giochi, i quiz e le prove ti sono piaciuti?', opzioni: SCALA(['per niente', 'poco', 'così così', 'abbastanza', 'molto']) },
  { id: 'g5', tipo: 'singola', sezione: 'gradimento', testo: 'Consiglieresti questo laboratorio a un amico o a un’amica?', opzioni: SI_FORSE_NO },
  { id: 'g6', tipo: 'singola', sezione: 'gradimento', testo: 'Ti è venuta voglia di approfondire questi argomenti?', opzioni: SI_FORSE_NO },
  { id: 'g7', tipo: 'aperta', sezione: 'gradimento', testo: 'La cosa più utile che hai imparato oggi è…' },
  { id: 'g8', tipo: 'aperta', sezione: 'gradimento', testo: 'Cosa cambieresti del laboratorio?' }
];

export const GENERE = {
  id: 'g9', tipo: 'singola', sezione: 'gradimento', facoltativa: true,
  testo: 'Ti identifichi come…',
  aiuto: 'Domanda facoltativa: puoi lasciarla vuota.',
  opzioni: [
    { id: 'f', testo: 'Femmina' },
    { id: 'm', testo: 'Maschio' },
    { id: 'altro', testo: 'Altro' },
    { id: 'nr', testo: 'Preferisco non rispondere' }
  ]
};

export const MAX_APERTA = 500;

/** Le domande di una fase, nell'ordine in cui le vede lo studente. */
export function domandePer(argomento, fase, conGenere = false) {
  const test = TEST[argomento] || [];
  if (fase === 'ingresso') return [STEM.s1, STEM.s2, STEM.s3, STEM.s4, ...test];
  return [...test, STEM.s3, STEM.s4, ...GRADIMENTO, ...(conGenere ? [GENERE] : [])];
}

/** Una risposta (valore salvato) è corretta? null se la domanda non ha risposta giusta. */
export function eCorretta(d, valore) {
  if (!d.corretta || valore == null) return null;
  if (Array.isArray(d.corretta)) {
    const scelte = String(valore).split(',').filter(Boolean).sort();
    const giuste = [...d.corretta].sort();
    return scelte.length === giuste.length && scelte.every((x, i) => x === giuste[i]);
  }
  return valore === d.corretta;
}

/** Tutte le domande possibili, per cercarle per id nell'esportazione. */
export function tutteLeDomande(argomento) {
  return [STEM.s1, STEM.s2, STEM.s3, STEM.s4, ...(TEST[argomento] || []), ...GRADIMENTO, GENERE];
}
