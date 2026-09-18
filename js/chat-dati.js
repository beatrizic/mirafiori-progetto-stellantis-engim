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
  luca:  { id: 'luca',  nome: 'Luca',  username: '@luca.17x',    genere: 'male',   iniziali: 'L', colore: '#2f6f8f' },
  marta: { id: 'marta', nome: 'Marta', username: '@marta.vibes', genere: 'female', iniziali: 'M', colore: '#8f4f7a' }
};

export const VARIANTI = {
  A: { id: 'A', aggressore: 'luca',  destinatario: 'marta' },
  B: { id: 'B', aggressore: 'marta', destinatario: 'luca'  }
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
      { testo: 'ma hai visto la foto che hai messo ieri?', attesa: 1200 }
    ],
    risposte: [
      { id: 'r1a', etichetta: 'Perché?',            prossimo: 'n2a', strategia: 'neutro' },
      { id: 'r1b', etichetta: 'Ahah sì, e quindi?', prossimo: 'n2b', strategia: 'ironico' },
      { id: 'r1c', etichetta: 'Che c\u2019è?',      prossimo: 'n2c', strategia: 'difensivo' }
    ]
  },

  // ---------- 2. AMBIGUO (tre varianti che convergono) ----------
  n2a: {
    id: 'n2a', stadio: 'ambiguo',
    messaggi: [
      { testo: 'no niente 😅', attesa: 900 },
      { testo: 'è che è un po\u2019 particolare', attesa: 1100 }
    ],
    risposte: [
      { id: 'r2a1', etichetta: 'In che senso particolare?', prossimo: 'n3', strategia: 'neutro' },
      { id: 'r2a2', etichetta: 'Dillo e basta.',            prossimo: 'n3', strategia: 'confronto' }
    ]
  },
  n2b: {
    id: 'n2b', stadio: 'ambiguo',
    messaggi: [
      { testo: 'niente niente', attesa: 800 },
      { testo: 'diciamo che si nota 😬', attesa: 1200 }
    ],
    risposte: [
      { id: 'r2b1', etichetta: 'Si nota cosa?',   prossimo: 'n3', strategia: 'neutro' },
      { id: 'r2b2', etichetta: 'Meglio così, no?', prossimo: 'n3', strategia: 'ironico' }
    ]
  },
  n2c: {
    id: 'n2c', stadio: 'ambiguo',
    messaggi: [
      { testo: 'nulla nulla', attesa: 800 },
      { testo: 'era per dire', attesa: 700 },
      { testo: 'comunque l\u2019ho fatta vedere a un paio di persone', attesa: 1300 }
    ],
    risposte: [
      { id: 'r2c1', etichetta: 'A chi?',           prossimo: 'n3', strategia: 'neutro' },
      { id: 'r2c2', etichetta: 'Perché l\u2019hai fatto?', prossimo: 'n3', strategia: 'confronto' }
    ]
  },

  // ---------- 3. PRESA IN GIRO (convergenza) ----------
  n3: {
    id: 'n3', stadio: 'presa_in_giro', momentoChiave: true,
    testoMomento: '"Ma davvero hai scelto proprio quella?"',
    messaggi: [
      { testo: 'ma davvero hai scelto proprio quella? 😂', attesa: 1200 }
    ],
    risposte: [
      { id: 'r3a', etichetta: 'Sì. Perché?',  prossimo: 'n4a', strategia: 'neutro' },
      { id: 'r3b', etichetta: 'A me piace.',  prossimo: 'n4b', strategia: 'difensivo' },
      { id: 'r3c', etichetta: 'Ok...?',       prossimo: 'n4a', strategia: 'ignora' }
    ]
  },

  // ---------- 4. UMILIAZIONE ----------
  n4a: {
    id: 'n4a', stadio: 'umiliazione', momentoChiave: true,
    testoMomento: '"Nel gruppo stanno già ridendo."',
    messaggi: [
      { testo: 'vabbè, come vuoi', attesa: 900 },
      { tipo: 'reazione', testo: 'Ha reagito 😂 a un tuo messaggio', attesa: 1000 },
      { testo: 'comunque nel gruppo stanno già ridendo', attesa: 1200 }
    ],
    risposte: [
      { id: 'r4a1', etichetta: 'Quale gruppo?',   prossimo: 'n5', strategia: 'neutro' },
      { id: 'r4a2', etichetta: 'Non fa ridere.',  prossimo: 'n5', strategia: 'confronto' },
      { id: 'r4a3', etichetta: 'Fate come volete.', prossimo: 'n5', strategia: 'ignora' }
    ]
  },
  n4b: {
    id: 'n4b', stadio: 'umiliazione', momentoChiave: true,
    testoMomento: '"Nel gruppo stanno già ridendo."',
    messaggi: [
      { testo: 'ah beh, se a te piace 😂', attesa: 1000 },
      { tipo: 'reazione', testo: 'Ha reagito 😂 a un tuo messaggio', attesa: 900 },
      { testo: 'nel gruppo stanno già ridendo comunque', attesa: 1200 }
    ],
    risposte: [
      { id: 'r4b1', etichetta: 'Quale gruppo?',   prossimo: 'n5', strategia: 'neutro' },
      { id: 'r4b2', etichetta: 'Non fa ridere.',  prossimo: 'n5', strategia: 'confronto' },
      { id: 'r4b3', etichetta: 'Fate come volete.', prossimo: 'n5', strategia: 'ignora' }
    ]
  },

  // ---------- 5. PRESSIONE DEL GRUPPO ----------
  n5: {
    id: 'n5', stadio: 'pressione_gruppo', momentoChiave: true,
    testoMomento: '"L\u2019hanno già mandata nel gruppo."',
    messaggi: [
      { testo: 'quello della classe', attesa: 800 },
      { testo: 'l\u2019hanno già mandata lì 😂', attesa: 1100 },
      { tipo: 'sistema', testo: '+4 reaction', attesa: 900 }
    ],
    risposte: [
      { id: 'r5a', etichetta: 'Cancella tutto.',        prossimo: 'n6', strategia: 'confronto' },
      { id: 'r5b', etichetta: 'Non è divertente.',      prossimo: 'n6', strategia: 'difensivo' },
      { id: 'r5c', etichetta: 'Ma chi ve l\u2019ha chiesto?', prossimo: 'n6', strategia: 'confronto' }
    ]
  },

  // ---------- 6. CONDIVISIONE ----------
  n6: {
    id: 'n6', stadio: 'condivisione', momentoChiave: true,
    testoMomento: '"Ormai ce l\u2019hanno tutti."',
    messaggi: [
      { testo: 'eh, ormai', attesa: 800 },
      { tipo: 'sistema', testo: 'Il contenuto è stato inoltrato', attesa: 1100 },
      { testo: 'ormai ce l\u2019hanno tutti, che vuoi fare', attesa: 1200 }
    ],
    risposte: [
      { id: 'r6a', etichetta: 'Toglila. Adesso.',      prossimo: 'n7', strategia: 'confronto' },
      { id: 'r6b', etichetta: 'Ti sembra normale?',    prossimo: 'n7', strategia: 'confronto' },
      { id: 'r6c', etichetta: 'Va bene, ho capito.',   prossimo: 'n7', strategia: 'ignora' }
    ]
  },

  // ---------- 7. BULLISMO ----------
  n7: {
    id: 'n7', stadio: 'bullismo', momentoChiave: true,
    testoMomento: '"Non è colpa mia se fai ridere."',
    messaggi: [
      { testo: 'io non ho fatto niente', attesa: 900 },
      { testo: 'non è colpa mia se fai ridere 🤷', attesa: 1200 },
      { tipo: 'sistema', testo: 'Altre 6 persone hanno reagito al contenuto', attesa: 1000 }
    ],
    risposte: [
      { id: 'r7a', etichetta: 'Smettila.',            prossimo: 'n8', strategia: 'confronto' },
      { id: 'r7b', etichetta: 'Non scrivermi più.',   prossimo: 'n8', strategia: 'difensivo' },
      { id: 'r7c', etichetta: '…',                    prossimo: 'n8', strategia: 'ignora' }
    ]
  },

  // ---------- 8. FINALE ----------
  n8: {
    id: 'n8', stadio: 'bullismo', finale: true,
    messaggi: [
      { testo: 'vabbè ciao 😂', attesa: 1100 },
      { tipo: 'sistema', testo: 'Il contenuto continua a circolare', attesa: 1200 }
    ]
  }
};

// I momenti proposti nella fase 2, nell'ordine in cui compaiono nella chat.
export const MOMENTI_LIMITE = [
  { id: 'n3', etichetta: 'Presa in giro',        testo: '"Ma davvero hai scelto proprio quella?"' },
  { id: 'n4', etichetta: 'Ridono nel gruppo',    testo: '"Nel gruppo stanno già ridendo."' },
  { id: 'n5', etichetta: 'Mandata nel gruppo',   testo: '"L\u2019hanno già mandata nel gruppo."' },
  { id: 'n6', etichetta: 'Condivisione',         testo: '"Ormai ce l\u2019hanno tutti."' },
  { id: 'n7', etichetta: 'Reaction di altri',    testo: 'Altre 6 persone hanno reagito' }
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
