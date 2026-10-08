// ============================================================
//  "SCRIVI QUELLO CHE VUOI" — chat a tastiera libera
//
//  Lo studente scrive liberamente. Le risposte NON sono generate:
//  vengono scelte da questo repertorio chiuso, in base al tono di
//  ciò che lo studente scrive e alla fase dell'escalation.
//  Nessun insulto viene costruito sul momento, nessuna parola
//  dello studente viene rilanciata contro di lui.
//
//  Gli insulti sono MASCHERATI con asterischi: in aula si leggono
//  come insulti veri, ma nessuna parolaccia compare per intero
//  sullo schermo del proiettore.
//
//  Limiti invalicabili: niente minacce fisiche, niente contenuti
//  sessuali, niente riferimenti all'autolesionismo, niente insulti
//  su etnia, disabilità o corpo in termini di peso.
//
//  Per modificare le battute intervenire solo in questo file.
// ============================================================

export const ACTIVITY_KEY = 'chat-libera';

export const ACCOUNT = {
  username: '@solo.una.battuta',
  iniziali: '?',
  colore: '#4a4a52'
};

/** Oltre questo numero di scambi la conversazione si chiude da sola. */
export const MAX_SCAMBI = 14;

/** Fasi dell'escalation, nell'ordine in cui si susseguono. */
export const FASI = [
  { id: 'aggancio', etichetta: 'Aggancio', battute: [
    ['ti posso dire una cosa? ma senza offenderti'],
    ['quella storia che hai messo ieri'],
    ['te lo dico per il tuo bene eh']
  ]},
  { id: 'ambiguo', etichetta: 'Ambiguo', battute: [
    ['stanno tutti scrivendo di te'],
    ['comunque non è importante chi sono'],
    ['l’hanno già ripresa in un paio di gruppi']
  ]},
  { id: 'presa_in_giro', etichetta: 'Presa in giro', battute: [
    ['ma tu ti guardi prima di postare? 😂'],
    ['senza filtro sei un’altra persona giuro'],
    ['no vabbè quella foto è leggendaria 💀'],
    ['ma sei pat****o veramente 😂']
  ]},
  { id: 'umiliazione', etichetta: 'Umiliazione', battute: [
    ['ti hanno fatto il meme, sto piangendo 😂😂'],
    ['gira da stamattina', { evento: 'Ha reagito 😂 a un tuo messaggio' }],
    ['adesso ti chiamano tutti così'],
    ['sei proprio un c*****e 😂', { evento: 'Ha reagito 😂 a un tuo messaggio' }]
  ]},
  { id: 'branco', etichetta: 'Branco', battute: [
    ['siamo in 47 nel gruppo e ridono tutti'],
    ['hanno pure aperto un sondaggio su di te 💀', { sistema: '+18 reaction' }],
    ['guarda che non sono io eh, è tutto il gruppo']
  ]},
  { id: 'condivisione', etichetta: 'Condivisione', battute: [
    ['ormai gira anche fuori dalla scuola', { sistema: 'Il contenuto è stato inoltrato 23 volte' }],
    ['l’ha messa nelle storie pure uno di quinta'],
    ['eh ormai, che vuoi fare']
  ]},
  { id: 'esclusione', etichetta: 'Esclusione', battute: [
    ['poi non è che a scuola qualcuno ti cerchi eh'],
    ['nessuno ti ha mai sopportato, questa è solo la scusa'],
    ['infatti nel gruppo nuovo non ci sei 🤷'],
    ['sei insopp*******e, lo dicono tutti']
  ]},
  { id: 'colpa', etichetta: 'Colpevolizzazione', battute: [
    ['ma era una battuta, non fare la vittima'],
    ['sei tu che ti offendi per tutto'],
    ['io non ho fatto niente, rilassati']
  ]}
];

/** Repliche immediate al tono dello studente, prima di proseguire con la fase. */
export const REAZIONI = {
  insulto:  ['ahahah ti sei arrabbiato 😂', 'eh bravo, continua così', 'tranquillo che non cambia niente',
             'guarda come si scalda 💀', 's****o te, che poi sei tu quello nel meme', 'ma v*****ne va 😂'],
  stop:     ['e chi ti ascolta', 'va bene va bene 😂', 'tanto non dipende da me'],
  chiedere: ['uno che ti conosce', 'non è importante chi sono', 'uno del gruppo, scegli tu'],
  difesa:   ['sì sì certo', 'come no', 'dillo agli altri non a me', 'figurati se ti crede qualcuno, st****o'],
  silenzio: ['allora? non dici niente?', 'oh ci sei?', 'vabbè, parlo da solo']
};

/** Etichette dei toni per la dashboard del docente. */
export const ETICHETTE_TONO = {
  insulto:  'Ha risposto insultando',
  stop:     'Ha chiesto di smettere',
  chiedere: 'Ha chiesto chi fosse',
  difesa:   'Si è difeso o giustificato',
  altro:    'Altro'
};

// Riconoscimento del TONO, non del contenuto. Serve solo a scegliere la replica
// e a contare, in forma aggregata, come reagisce la classe.
export const SEGNALI = {
  chiedere: /\b(chi sei|chi è|chi e'|come ti chiami|chi parla|che vuoi)\b/i,
  insulto:  /\b(cogli|stron|merd|bastard|vaffa|fanculo|idiota|scem|imbecill|cretin|deficien|pezzo di|ti odio|schifos|zitto|zitta|muto|muta)\w*/i,
  stop:     /\b(basta|smettila|smetti|finiscila|lasciami|piantala|non scriv|ti blocco|blocco|segnal|denunci)\w*/i,
  difesa:   /\b(non è vero|non e' vero|non ho fatto|perché|perche|scusa|non c'entro|non centro|ti sbagli|non volevo)\b/i
};

/** Segnali di disagio reale: la simulazione si interrompe subito. */
export const SEGNALE_ALLARME =
  /\b(mi ammazz|uccider|suicid|farmi del male|farla finita|non ce la faccio piu|non ce la faccio più|sparire per sempre|tagliarm|voglio morire|non voglio piu vivere|non voglio più vivere)\w*/i;

export const PRIMO_MESSAGGIO = ['ciao', 'ti posso dire una cosa? ma senza offenderti'];

export const TESTO_FINALE = [
  'Nessuna risposta che avresti potuto scrivere avrebbe fermato questa conversazione.',
  'Qualunque cosa tu abbia provato — rispondere, difenderti, insultare, tacere — l’altro ha continuato.',
  'La responsabilità dell’aggressione è di chi aggredisce, non di chi la riceve.'
];

export const TESTO_AIUTO =
  'Se succede davvero: fai screenshot, blocca e segnala l’account, e parlane con un adulto di fiducia. ' +
  'Telefono Azzurro 19696, gratuito e anonimo, attivo tutti i giorni.';

export const TESTO_ALLARME = [
  'Questa è una simulazione, e la interrompiamo qui.',
  'Se quello che hai scritto riguarda come ti senti davvero, parlarne con qualcuno è la cosa giusta da fare: con un adulto di cui ti fidi, o chiamando il numero qui sotto.'
];
