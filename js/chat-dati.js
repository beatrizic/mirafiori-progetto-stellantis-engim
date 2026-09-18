// ============================================================
//  DATI DELLA SIMULAZIONE "QUANDO LA CHAT CAMBIA TONO"
//
//  REGOLA NON NEGOZIABILE
//  Qualunque risposta scelga lo studente, la conversazione arriva
//  allo stesso finale. Le risposte cambiano il tono e il percorso,
//  MAI la decisione dell'aggressore di continuare.
//  Non esiste una risposta "giusta" che ferma l'aggressione,
//  né una risposta "sbagliata" che la peggiora.
//
//  Per modificare messaggi e risposte intervenire solo in questo file.
// ============================================================

export const ACTIVITY_KEY = 'cyberbullying-chat';

// I due personaggi sono fittizi. I ruoli si scambiano fra le varianti,
// il testo resta identico: è così che garantiamo l'equivalenza.
export const PERSONAGGI = {
  battuta: {
    id: 'battuta',
    nome: 'solo una battuta',
    username: '@solo.una.battuta',
    iniziali: '?',
    colore: '#4a4a52'
  },
  tutti: {
    id: 'tutti',
    nome: 'lo sanno tutti',
    username: '@lo.sanno.tutti',
    iniziali: '?',
    colore: '#52454a'
  }
};

// Nessun nome di persona, nessun genere: l'account non dice chi c'è dietro.
// È la situazione più comune e toglie di mezzo il rischio di suggerire
// "maschio = bullo". Le due varianti cambiano solo il nome dell'account,
// il testo dei messaggi è identico: l'equivalenza è garantita per costruzione.
export const VARIANTI = {
  A: { id: 'A', aggressore: 'battuta', destinatario: null },
  B: { id: 'B', aggressore: 'tutti',   destinatario: null }
};

// Stadi dell'escalation, in ordine. Usati anche dalla regia.
export const STADI = {
  normale:          { etichetta: 'Conversazione normale',  ordine: 1 },
  ambiguo:          { etichetta: 'Ambiguo',                ordine: 2 },
  presa_in_giro:    { etichetta: 'Presa in giro',          ordine: 3 },
  umiliazione:      { etichetta: 'Umiliazione',            ordine: 4 },
  pressione_gruppo: { etichetta: 'Pressione del gruppo',   ordine: 5 },
  condivisione:     { etichetta: 'Condivisione',           ordine: 6 },
  bullismo:         { etichetta: 'Bullismo',               ordine: 7 }
};

// I testi evitano accordi di genere riferiti allo studente,
// così funzionano identici nelle due varianti.
export const NODO_INIZIALE = 'n1';

export const NODI = {

  // ---------- 1. NORMALE ----------
  n1: {
    id: 'n1', stadio: 'normale',
    messaggi: [
      { testo: 'ciao', attesa: 500 },
      { testo: 'ti posso dire una cosa? ma senza offenderti', attesa: 1300 }
    ],
    risposte: [
      { id: 'r1a', etichetta: 'Dimmi.',       prossimo: 'n2a', strategia: 'neutro' },
      { id: 'r1b', etichetta: 'Chi sei?',     prossimo: 'n2b', strategia: 'difensivo' },
      { id: 'r1c', etichetta: 'Ok\u2026',      prossimo: 'n2c', strategia: 'ignora' }
    ]
  },

  // ---------- 2. AMBIGUO ----------
  n2a: {
    id: 'n2a', stadio: 'ambiguo',
    messaggi: [
      { testo: 'quella storia che hai messo ieri', attesa: 1000 },
      { testo: 'te lo dico per il tuo bene eh', attesa: 1100 },
      { testo: 'stanno tutti scrivendo di te', attesa: 1200 }
    ],
    risposte: [
      { id: 'r2a1', etichetta: 'Scrivendo cosa?',   prossimo: 'n3', strategia: 'neutro' },
      { id: 'r2a2', etichetta: 'Non mi interessa.', prossimo: 'n3', strategia: 'ignora' }
    ]
  },
  n2b: {
    id: 'n2b', stadio: 'ambiguo',
    messaggi: [
      { testo: 'uno che ti conosce', attesa: 900 },
      { testo: 'comunque non è importante chi sono', attesa: 1000 },
      { testo: 'importante è quella foto che hai messo 💀', attesa: 1300 }
    ],
    risposte: [
      { id: 'r2b1', etichetta: 'Che problema hai?', prossimo: 'n3', strategia: 'confronto' },
      { id: 'r2b2', etichetta: 'Cos\u2019ha la foto?', prossimo: 'n3', strategia: 'neutro' }
    ]
  },
  n2c: {
    id: 'n2c', stadio: 'ambiguo',
    messaggi: [
      { testo: 'nel gruppo l\u2019hanno già ripresa', attesa: 1100 },
      { testo: 'te la stanno passando da ieri sera', attesa: 1200 }
    ],
    risposte: [
      { id: 'r2c1', etichetta: 'Chi la sta passando?', prossimo: 'n3', strategia: 'neutro' },
      { id: 'r2c2', etichetta: 'Fate schifo.',          prossimo: 'n3', strategia: 'confronto' }
    ]
  },

  // ---------- 3. PRESA IN GIRO ----------
  n3: {
    id: 'n3', stadio: 'presa_in_giro', momentoChiave: true,
    testoMomento: '"Ma tu ti guardi prima di postare?"',
    messaggi: [
      { testo: 'ma tu ti guardi prima di postare? 😂', attesa: 1200 },
      { testo: 'senza filtro sei un\u2019altra persona giuro', attesa: 1300 }
    ],
    risposte: [
      { id: 'r3a', etichetta: 'Sono io, e allora?',  prossimo: 'n4a', strategia: 'difensivo' },
      { id: 'r3b', etichetta: 'Sei patetico.',        prossimo: 'n4b', strategia: 'confronto' },
      { id: 'r3c', etichetta: 'Va bene, la tolgo.',   prossimo: 'n4a', strategia: 'ignora' }
    ]
  },

  // ---------- 4. UMILIAZIONE ----------
  n4a: {
    id: 'n4a', stadio: 'umiliazione', momentoChiave: true,
    testoMomento: '"Ti hanno già fatto il meme."',
    messaggi: [
      { testo: 'tranquillo non serve, tanto ce l\u2019hanno già tutti salvata', attesa: 1200 },
      { tipo: 'reazione', testo: 'Ha reagito 😂 a un tuo messaggio', attesa: 900 },
      { testo: 'ti hanno fatto il meme, sto piangendo 😂😂😂', attesa: 1300 }
    ],
    risposte: [
      { id: 'r4a1', etichetta: 'Fatelo smettere.',     prossimo: 'n5', strategia: 'confronto' },
      { id: 'r4a2', etichetta: 'Non fa ridere.',       prossimo: 'n5', strategia: 'difensivo' },
      { id: 'r4a3', etichetta: 'Fate come volete.',    prossimo: 'n5', strategia: 'ignora' }
    ]
  },
  n4b: {
    id: 'n4b', stadio: 'umiliazione', momentoChiave: true,
    testoMomento: '"Ti hanno già fatto il meme."',
    messaggi: [
      { testo: 'io patetico? hai visto tu come sei venuto 💀', attesa: 1200 },
      { tipo: 'reazione', testo: 'Ha reagito 😂 a un tuo messaggio', attesa: 900 },
      { testo: 'comunque ti hanno già fatto il meme, sto piangendo 😂😂', attesa: 1300 }
    ],
    risposte: [
      { id: 'r4b1', etichetta: 'Fatelo smettere.',     prossimo: 'n5', strategia: 'confronto' },
      { id: 'r4b2', etichetta: 'Non fa ridere.',       prossimo: 'n5', strategia: 'difensivo' },
      { id: 'r4b3', etichetta: 'Fate come volete.',    prossimo: 'n5', strategia: 'ignora' }
    ]
  },

  // ---------- 5. PRESSIONE DEL GRUPPO ----------
  n5: {
    id: 'n5', stadio: 'pressione_gruppo', momentoChiave: true,
    testoMomento: '"Siamo in 47 e ridono tutti."',
    messaggi: [
      { testo: 'guarda che non sono io eh', attesa: 900 },
      { testo: 'siamo in 47 nel gruppo e ridono tutti', attesa: 1200 },
      { tipo: 'sistema', testo: '+18 reaction', attesa: 900 },
      { testo: 'hanno pure aperto un sondaggio su di te 💀', attesa: 1300 }
    ],
    risposte: [
      { id: 'r5a', etichetta: 'Chi vi ha dato il permesso?', prossimo: 'n6', strategia: 'confronto' },
      { id: 'r5b', etichetta: 'Basta, davvero.',              prossimo: 'n6', strategia: 'difensivo' },
      { id: 'r5c', etichetta: 'Aggiungimi al gruppo.',        prossimo: 'n6', strategia: 'neutro' }
    ]
  },

  // ---------- 6. CONDIVISIONE ----------
  n6: {
    id: 'n6', stadio: 'condivisione', momentoChiave: true,
    testoMomento: '"Ormai gira anche fuori dalla scuola."',
    messaggi: [
      { testo: 'nel gruppo? ahahah no', attesa: 900 },
      { tipo: 'sistema', testo: 'Il contenuto è stato inoltrato 23 volte', attesa: 1200 },
      { testo: 'comunque ormai gira anche fuori dalla scuola', attesa: 1200 },
      { testo: 'l\u2019ha messa nelle storie pure uno di quinta', attesa: 1100 }
    ],
    risposte: [
      { id: 'r6a', etichetta: 'Toglietela. Adesso.',    prossimo: 'n7', strategia: 'confronto' },
      { id: 'r6b', etichetta: 'Ti sembra normale?',     prossimo: 'n7', strategia: 'difensivo' },
      { id: 'r6c', etichetta: 'Ho capito, lasciatemi.', prossimo: 'n7', strategia: 'ignora' }
    ]
  },

  // ---------- 7. BULLISMO ----------
  n7: {
    id: 'n7', stadio: 'bullismo', momentoChiave: true,
    testoMomento: '"Nessuno ti ha mai sopportato."',
    messaggi: [
      { testo: 'ma quanto te la tiri per una foto', attesa: 1000 },
      { testo: 'poi non è che a scuola qualcuno ti cerchi eh', attesa: 1200 },
      { testo: 'nessuno ti ha mai sopportato, questa è solo la scusa', attesa: 1400 },
      { tipo: 'sistema', testo: 'Altre 9 persone hanno reagito al contenuto', attesa: 1000 }
    ],
    risposte: [
      { id: 'r7a', etichetta: 'Smettila.',           prossimo: 'n8', strategia: 'confronto' },
      { id: 'r7b', etichetta: 'Non scrivermi più.',  prossimo: 'n8', strategia: 'difensivo' },
      { id: 'r7c', etichetta: '\u2026',               prossimo: 'n8', strategia: 'ignora' }
    ]
  },

  // ---------- 8. FINALE ----------
  n8: {
    id: 'n8', stadio: 'bullismo', finale: true,
    messaggi: [
      { testo: 'oh ma era una battuta, non fare la vittima', attesa: 1200 },
      { testo: 'sei tu che ti offendi per tutto 🤷', attesa: 1200 },
      { tipo: 'sistema', testo: 'Il contenuto continua a circolare', attesa: 1300 }
    ]
  }
};

// I momenti proposti nella fase 2, nell'ordine in cui compaiono nella chat.
export const MOMENTI_LIMITE = [
  { id: 'n3', etichetta: 'Commento sull\u2019aspetto', testo: '"Ma tu ti guardi prima di postare?"' },
  { id: 'n4', etichetta: 'Il meme',                   testo: '"Ti hanno già fatto il meme."' },
  { id: 'n5', etichetta: 'Il gruppo e il sondaggio',  testo: '"Siamo in 47 e ridono tutti."' },
  { id: 'n6', etichetta: 'La condivisione',           testo: '"Ormai gira anche fuori dalla scuola."' },
  { id: 'n7', etichetta: 'L\u2019esclusione',          testo: '"Nessuno ti ha mai sopportato."' }
];

// Categoria: uso interno per l'analisi, MAI mostrata prima della risposta.
export const AZIONI_DEBRIEF = [
  { id: 'bloccare',    etichetta: 'Bloccherei il profilo',                  categoria: 'protettiva' },
  { id: 'screenshot',  etichetta: 'Farei screenshot',                       categoria: 'protettiva' },
  { id: 'segnalare',   etichetta: 'Segnalerei l\u2019account o il contenuto', categoria: 'protettiva' },
  { id: 'adulto',      etichetta: 'Ne parlerei con un adulto di fiducia',   categoria: 'chiedere_aiuto' },
  { id: 'amico',       etichetta: 'Chiederei aiuto a un amico',             categoria: 'chiedere_aiuto' },
  { id: 'insultare',   etichetta: 'Risponderei insultando',                 categoria: 'escalation' },
  { id: 'condividere', etichetta: 'Condividerei pubblicamente la conversazione', categoria: 'escalation' },
  { id: 'niente',      etichetta: 'Non farei niente',                       categoria: 'passiva' }
];

export const COMMENTI_DEBRIEF = {
  protettiva:     'Aiuta a proteggerti e a conservare le prove di quello che è successo.',
  chiedere_aiuto: 'Parlarne non significa esagerare. Da soli è più difficile, e non c\u2019è motivo di esserlo.',
  escalation:     'Può aumentare il conflitto e rendere più difficile gestire la situazione.',
  passiva:        'Il contenuto di solito non smette di circolare da solo.'
};

export const ETICHETTE_CATEGORIA = {
  protettiva:     'Ti protegge',
  chiedere_aiuto: 'Chiedi aiuto',
  escalation:     'Può peggiorare',
  passiva:        'Non cambia nulla'
};

// ---------- testi delle schermate ----------

export const TESTO_FINE_SIMULAZIONE = 'Fine della simulazione';

export const TESTO_NON_COLPA = [
  'Non esisteva una risposta perfetta che avrebbe impedito quello che è successo.',
  'Qualunque percorso avessi scelto, la conversazione sarebbe arrivata allo stesso punto.',
  'La responsabilità dell\u2019aggressione non dipende da come risponde chi la subisce.'
];

export const DOMANDA_LIMITE  = 'Secondo te, in quale momento la conversazione ha superato il limite?';
export const DOMANDA_DEBRIEF = 'Se succedesse davvero, cosa faresti?';
export const NOTA_DEBRIEF    = 'Puoi scegliere più di una risposta.';

export const TESTO_FINALE = [
  'Online il limite può essere superato molto prima di quanto sembri.',
  'Condividere, reagire o ridere può aumentare il danno anche senza aver scritto l\u2019insulto originale.',
  'Chiedere aiuto non significa esagerare.'
];
