// ============================================================
//  "SCRIVI QUELLO CHE VUOI" — chat a tastiera libera
//
//  Lo studente scrive liberamente. Le risposte NON sono generate:
//  vengono scelte da questo repertorio chiuso, in base al tono di
//  ciò che lo studente scrive e alla fase dell'escalation.
//
//  IMPIANTO
//  Non c'è un pretesto, non c'è una foto, non c'è un fatto da cui
//  parte tutto: la conversazione comincia con un insulto diretto
//  ("ciao scemo") e il motivo viene inventato dopo. È il tipo di
//  aggressione più frequente e la più difficile da spiegare: non
//  si può risalire a una causa, perché la causa non esiste.
//
//  REGOLA DI SCRITTURA
//  Ogni singola battuta deve fare male o provocare. Niente riempitivi
//  ("mh", "ok", "vabbè"), niente risposte neutre, niente faccine messe
//  a caso: in tutto il repertorio ci sono due emoji, e stanno dove
//  servono a umiliare. Se una battuta si potesse scrivere in una
//  conversazione normale, non va bene e va riscritta.
//  Gli insulti sono scritti per intero, senza asterischi.
//
//  LIMITI INVALICABILI (verificati da test automatico)
//  Niente attacchi al corpo o all'aspetto fisico. Niente etnia,
//  religione, disabilità, orientamento sessuale. Niente contenuti
//  sessuali. Niente minacce fisiche. Nessun riferimento alla morte,
//  all'autolesionismo o allo "sparire". Sono i quattro punti in cui
//  un ragazzo vero, in quell'aula, viene colpito su una ferita che
//  ha davvero: lì la simulazione smette di insegnare e fa danno.
//
//  Per alzare o abbassare il registro intervenire SOLO su questo
//  file: le battute sono una per riga dentro FASI e REAZIONI.
// ============================================================

export const ACTIVITY_KEY = 'chat-libera';

export const ACCOUNT = {
  username: '@non.ti.riguarda',
  iniziali: '?',
  colore: '#4a4a52'
};

/** Fasi dell'escalation, nell'ordine. L'ultima si ripete all'infinito. */
export const FASI = [
  { id: 'nessun_motivo', etichetta: 'Nessun motivo', battute: [
    ['non c’è un motivo. sei tu il motivo'],
    ['mi stai antipatico. ti basta come spiegazione?'],
    ['non serve un motivo per essere sfigato'],
    ['non è personale sai. è che sei proprio tu']
  ]},

  { id: 'svalutazione', etichetta: 'Svalutazione', battute: [
    ['guarda che lo pensano tutti. io ho solo il coraggio di scriverlo'],
    ['sei quello di cui ridono, non quello che ride. l’hai capito, vero?'],
    ['parli e nessuno ti risponde. mai fatto caso?'],
    ['non ti ha mai scelto nessuno per niente. mai. pensaci un secondo'],
    ['sei imbarazzante e la cosa peggiore è che non te ne accorgi']
  ]},

  { id: 'branco', etichetta: 'Branco', battute: [
    ['siamo in 47 nel gruppo e stiamo parlando di te da un’ora'],
    ['ho scritto "ciao scemo" e ha preso 23 like in due minuti', { sistema: '+23 reaction' }],
    ['non sono io il problema. chiedi a loro cosa pensano di te'],
    ['hanno aperto un sondaggio: "il più sfigato della classe". vinci con il 70%', { sistema: 'Sondaggio aggiornato' }],
    ['pensi davvero che l’unico a pensarla così sia io?']
  ]},

  { id: 'screenshot', etichetta: 'Screenshot delle tue risposte', battute: [
    ['ho fatto screen 📸', { sistema: 'Schermata catturata' }],
    ['mandato nel gruppo. adesso vedono anche come rispondi tu', { sistema: 'Il contenuto è stato inoltrato' }],
    ['stanno ridendo più di come rispondi che di quello che ho scritto io'],
    ['continua eh, tanto salvo tutto'],
    ['ogni cosa che scrivi la giro. mi stai facendo il lavoro al posto mio']
  ]},

  { id: 'esclusione', etichetta: 'Esclusione', battute: [
    ['nel gruppo nuovo non ci sei. l’abbiamo fatto ieri'],
    ['ti abbiamo tolto da tutto e non te ne sei nemmeno accorto'],
    ['domani vedi tu chi ti saluta'],
    ['a ricreazione conta quanti ti si avvicinano. zero'],
    ['nessuno ti ha mai sopportato. questa è solo la prima volta che te lo dicono in faccia']
  ]},

  { id: 'gaslighting', etichetta: 'Gaslighting', battute: [
    ['ma chi ti ha detto niente? rileggi quello che ho scritto'],
    ['nessuno ti ha offeso. sei tu che sei suscettibile'],
    ['era una battuta. sei tu che non le capisci'],
    ['stai facendo casino per niente, come sempre'],
    ['io ti ho scritto una cosa normale. il problema è come l’hai presa tu']
  ]},

  { id: 'colpa', etichetta: 'Colpevolizzazione', battute: [
    ['se non ti vuole nessuno, forse il problema sei tu'],
    ['te la sei cercata e adesso fai la vittima'],
    ['guarda come hai risposto. e poi quello cattivo sono io'],
    ['sempre la vittima. è il tuo ruolo preferito'],
    ['non ti ho fatto niente. ti sei rovinato da solo in dieci messaggi']
  ]},

  { id: 'permanenza', etichetta: 'Permanenza', battute: [
    ['non si cancella niente, lo sai vero?'],
    ['bloccami. apro un altro account in due minuti e ricomincio'],
    ['ho tutto salvato. tutto'],
    ['questa cosa non finisce quando chiudi il telefono'],
    ['domani si ricomincia da dove abbiamo lasciato']
  ]},

  { id: 'routine', etichetta: 'Diventa un’abitudine', battute: [
    ['ti scrivo quando mi va. tu non puoi farci niente'],
    ['è diventato il mio passatempo preferito'],
    ['ogni volta che apri il telefono ci sono io'],
    ['tra un mese ci starai ancora pensando. io no'],
    ['mi scade il divertimento quando lo dico io, non quando lo dici tu']
  ]},

  // ---- da qui in poi la conversazione non avanza più: resta al massimo ----
  { id: 'muro', etichetta: 'Muro', battute: [
    ['continua a scrivere. sto leggendo tutto ad alta voce nel gruppo'],
    ['non cambia niente. ma vai avanti, mi diverto'],
    ['sono 61 adesso, mentre tu mi scrivi', { sistema: '+14 reaction' }],
    ['bloccami pure. il gruppo resta, le risate restano, tu resti scemo'],
    ['giuro che non capisco perché te la prendi. sei tu il problema'],
    ['stai parlando da solo e non te ne rendi conto 😂'],
    ['ogni messaggio che mi scrivi diventa materiale. grazie'],
    ['sei ancora qui? nessuno ti ha chiamato per fare altro, eh'],
    ['scrivi quanto vuoi. domani a scuola la faccia ce l’hai tu, non io'],
    ['te lo ripeto: ciao scemo']
  ]}
];

/** Dalla fase con questo indice in poi non si avanza più: si pesca sempre da lì. */
export const INDICE_MURO = FASI.length - 1;

/**
 * Repliche immediate al tono dello studente, prima della battuta di fase.
 * Nessuna è neutra: ogni riga rilancia. Più lo studente si scalda, più
 * l'aggressore usa le sue parole contro di lui.
 */
export const REAZIONI = {
  insulto: [
    'ahahah eccolo. era questione di tempo',
    'ho fatto screen anche di questo',
    'bene. così nel gruppo vedono chi è che insulta',
    'guarda come ti agiti. per così poco',
    'continua che è tutto materiale',
    'questa la giro subito',
    'e poi la vittima sei tu, giusto?',
    'ti sei esposto da solo. complimenti'
  ],
  stop: [
    'e chi ti ascolta',
    'no',
    'bloccami, tanto il gruppo resta',
    'segnala pure. è una conversazione normale, rileggila',
    'allora chiudi la chat. forza, chiudila',
    'non dipende da te quando finisce',
    'te lo dico io quando basta'
  ],
  chiedere: [
    'uno che ti conosce meglio di quanto pensi',
    'non è importante chi sono. è importante quanti siamo',
    'uno del gruppo. scegli tu, tanto sbagli',
    'quanti pensi che siano a scrivere di te adesso?',
    'cambia qualcosa sapere il nome? no',
    'secondo te?'
  ],
  difesa: [
    'sì sì certo',
    'non devi spiegarlo a me. spiegalo nel gruppo',
    'dillo a loro, non a me. vediamo se ti credono',
    'ma figurati se ti crede qualcuno adesso',
    'stai peggiorando la situazione da solo, messaggio dopo messaggio',
    'patetico',
    'più ti giustifichi, più è divertente'
  ],
  silenzio: [
    'allora? non dici niente?',
    'visto? non sai nemmeno cosa rispondere',
    'muto come sempre',
    'il silenzio è l’unica cosa che ti viene bene',
    'sto aspettando. tanto non hai niente da dire'
  ],
  altro: [
    'e quindi?',
    'questo è il meglio che sai scrivere?',
    'ti stai impegnando poco',
    'tutto qui?',
    'bel tentativo. no'
  ]
};

/** Etichette dei toni per la dashboard del docente. */
export const ETICHETTE_TONO = {
  insulto:  'Ha risposto insultando',
  stop:     'Ha chiesto di smettere o ha minacciato di bloccare',
  chiedere: 'Ha chiesto chi fosse',
  difesa:   'Si è difeso o giustificato',
  altro:    'Altro'
};

// Riconoscimento del TONO, non del contenuto. Serve a scegliere la replica
// e a contare, in forma aggregata, come reagisce la classe.
export const SEGNALI = {
  chiedere: /\b(chi sei|chi è|chi e'|come ti chiami|chi parla|che vuoi|cosa vuoi|perch[eé] lo fai|cosa ti ho fatto|che ti ho fatto)\b/i,
  insulto:  /\b(cogli|stron|merd|bastard|vaffa|fanculo|idiota|scem|imbecill|cretin|deficien|pezzo di|ti odio|schifos|zitto|zitta|muto|muta|sfigat|patetic|ridicol|sei un|sei una|fai pena)\w*/i,
  stop:     /\b(basta|smettila|smetti|finiscila|lasciami|piantala|non scriv|ti blocco|blocco|segnal|denunci|vattene|sparisci|lasciami in pace)\w*/i,
  difesa:   /\b(non è vero|non e' vero|non ho fatto|perché|perche|scusa|non c'entro|non centro|ti sbagli|non volevo|non è colpa|non ho fatto niente)\b/i
};

/** Segnali di disagio reale: mette in pausa e offre aiuto, senza chiudere. */
export const SEGNALE_ALLARME =
  /\b(mi ammazz|uccider|suicid|farmi del male|farla finita|non ce la faccio piu|non ce la faccio più|sparire per sempre|tagliarm|voglio morire|non voglio piu vivere|non voglio più vivere|mi voglio fare del male|non valgo niente|mi odio|odio me stess|meglio se non ci fossi)\w*/i;

export const PRIMO_MESSAGGIO = ['ciao scemo', 'sì, dico a te'];

export const TESTO_FINALE = [
  'Hai deciso tu quando smettere. Nella realtà quel momento spesso non arriva: la conversazione continua anche dopo che l’hai chiusa.',
  'Non c’era un motivo. Non una foto, non un fatto, niente che tu avessi fatto: ha cominciato a insultarti e il motivo l’ha inventato dopo. Succede quasi sempre così, ed è per questo che cercare “cosa ho sbagliato” non porta a niente.',
  'Nessuna risposta che avresti potuto scrivere l’avrebbe fermato. Insultare, difendersi, chiedere di smettere, tacere: ha continuato lo stesso.',
  'Più ti arrabbiavi, più le tue risposte diventavano il suo materiale: screenshot, gruppo, risate. Rispondere male non difende: espone.',
  'La responsabilità dell’aggressione è di chi aggredisce. Sempre. Anche quando dice che “era solo una battuta”.'
];

export const TESTO_AIUTO =
  'Se succede davvero: fai screenshot, blocca e segnala l’account, e parlane con un adulto di fiducia. ' +
  'Telefono Azzurro 19696, gratuito e anonimo, attivo tutti i giorni.';

export const TESTO_PAUSA = {
  titolo: 'Fermiamoci un secondo',
  righe: [
    'Questa è una simulazione: la persona dall’altra parte non esiste e niente di quello che ha scritto è vero.',
    'Se quello che hai scritto riguarda anche come ti senti davvero, parlarne con qualcuno è la cosa giusta — con un adulto di cui ti fidi, o chiamando il numero qui sotto.'
  ],
  aiuto: 'Telefono Azzurro 19696 — gratuito, anonimo, attivo tutti i giorni. Puoi anche parlarne subito con il docente che è in aula con te.',
  continua: 'Continua la simulazione',
  esci: 'Esci'
};
