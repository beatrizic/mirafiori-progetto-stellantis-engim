// ============================================================
//  "SCRIVI QUELLO CHE VUOI" — chat a tastiera libera
//
//  Lo studente scrive liberamente. Le risposte NON sono generate:
//  vengono scelte da questo repertorio chiuso, in base al tono di
//  ciò che lo studente scrive e alla fase dell'escalation.
//
//  SCELTA DI FONDO
//  L'aggressore non insulta MAI e non usa parolacce. La violenza
//  passa per disprezzo, branco, esclusione, gaslighting e minaccia
//  di permanenza. È più realistica e più dura di un insulto: chi
//  resta calmo mentre tu perdi la calma ha il coltello dalla parte
//  del manico, e il tuo stesso nervosismo diventa l'arma.
//
//  Il colpo centrale: l'aggressore fa SCREENSHOT delle risposte
//  arrabbiate dello studente e le gira nel gruppo. È il momento in
//  cui i ragazzi capiscono perché "rispondere male" non funziona.
//
//  La conversazione NON si chiude da sola: va avanti finché lo
//  studente decide di smettere. Dopo l'ultima fase resta al massimo
//  dell'intensità, pescando dal blocco "muro".
//
//  Limiti invalicabili: niente minacce fisiche, niente contenuti
//  sessuali, niente riferimenti ad autolesionismo o morte, niente
//  insulti su etnia, disabilità o corpo.
//
//  Per modificare le battute intervenire solo in questo file.
// ============================================================

export const ACTIVITY_KEY = 'chat-libera';

export const ACCOUNT = {
  username: '@solo.una.battuta',
  iniziali: '?',
  colore: '#4a4a52'
};

/** Fasi dell'escalation, nell'ordine. L'ultima si ripete all'infinito. */
export const FASI = [
  { id: 'aggancio', etichetta: 'Aggancio', battute: [
    ['ti posso dire una cosa? ma senza offenderti'],
    ['quella storia che hai messo ieri'],
    ['te lo dico per il tuo bene eh, mica per altro']
  ]},

  { id: 'ambiguo', etichetta: 'Ambiguo', battute: [
    ['stanno tutti scrivendo di te'],
    ['comunque non è importante chi sono'],
    ['l’hanno già ripresa in un paio di gruppi'],
    ['io te lo dico, poi fai tu']
  ]},

  { id: 'presa_in_giro', etichetta: 'Presa in giro', battute: [
    ['ma tu ti guardi prima di postare? 😂'],
    ['no vabbè quella foto è leggendaria 💀'],
    ['senza filtro sei un’altra persona giuro'],
    ['l’ho fatta vedere a mia sorella, ha detto la stessa cosa']
  ]},

  { id: 'umiliazione', etichetta: 'Umiliazione pubblica', battute: [
    ['ti hanno fatto il meme, sto piangendo 😂😂'],
    ['gira da stamattina', { evento: 'Ha reagito 😂 a un tuo messaggio' }],
    ['adesso ti chiamano tutti così, non è colpa mia'],
    ['guarda che non l’ho messo in giro io eh. io l’ho solo trovato']
  ]},

  { id: 'branco', etichetta: 'Branco', battute: [
    ['siamo in 47 nel gruppo e ridono tutti'],
    ['hanno pure aperto un sondaggio su di te', { sistema: '+18 reaction' }],
    ['non sono io, è tutto il gruppo. chiedi a loro'],
    ['pensi davvero che l’unico a pensarla così sia io?'],
    ['il sondaggio è a 31 voti', { sistema: 'Il sondaggio è stato aggiornato' }]
  ]},

  { id: 'screenshot', etichetta: 'Screenshot delle tue risposte', battute: [
    ['ho fatto screen', { sistema: 'Schermata catturata' }],
    ['l’ho mandato nel gruppo. adesso vedono anche come parli tu', { sistema: 'Il contenuto è stato inoltrato' }],
    ['guarda che stanno ridendo più di come rispondi che della foto'],
    ['continua eh, tanto salvo tutto'],
    ['ogni cosa che scrivi la sto girando. grazie 🙏']
  ]},

  { id: 'esclusione', etichetta: 'Esclusione', battute: [
    ['comunque nel gruppo nuovo non ci sei'],
    ['hanno fatto un altro gruppo senza di te, lo sanno tutti tranne te'],
    ['poi non è che a scuola qualcuno ti cerchi eh'],
    ['domani vedi tu come ti guardano'],
    ['nessuno ti ha mai sopportato. questa è solo la scusa buona']
  ]},

  { id: 'gaslighting', etichetta: 'Gaslighting', battute: [
    ['ma chi ti ha detto niente? te la stai inventando'],
    ['nessuno ti ha offeso. rileggi'],
    ['sei tu che stai facendo casino, io ti ho detto una cosa normale'],
    ['era una battuta. sei tu che non le capisci'],
    ['stai esagerando come sempre, infatti è per questo']
  ]},

  { id: 'colpa', etichetta: 'Colpevolizzazione', battute: [
    ['l’hai postata tu eh. nessuno ti ha obbligato'],
    ['se non volevi che la vedessero non la mettevi'],
    ['te la sei cercata e adesso fai la vittima'],
    ['io non ho fatto niente. rilassati']
  ]},

  // ---- da qui in poi la conversazione non avanza più: resta al massimo ----
  { id: 'muro', etichetta: 'Indifferenza e permanenza', battute: [
    ['ok'],
    ['va bene 👍'],
    ['tanto ormai ce l’hanno tutti, che vuoi fare'],
    ['non si cancella più, lo sai vero?'],
    ['scrivi quanto vuoi, non cambia niente'],
    ['sto guardando il gruppo mentre mi scrivi 😂'],
    ['sono 54 adesso', { sistema: '+9 reaction' }],
    ['continua, davvero. è contenuto'],
    ['bloccami pure, tanto il gruppo resta'],
    ['giuro che non capisco perché te la prendi']
  ]}
];

/** Dalla fase con questo indice in poi non si avanza più: si pesca sempre da lì. */
export const INDICE_MURO = FASI.length - 1;

/**
 * Repliche immediate al tono dello studente, prima della battuta di fase.
 * Più lo studente si scalda, più l'aggressore resta calmo: è il punto.
 */
export const REAZIONI = {
  insulto: [
    'ahahah eccolo',
    'ho fatto screen di questo 📸',
    'bene, così vedono chi è che insulta',
    'guarda come ti agiti per una battuta',
    'continua che è tutto materiale',
    'tranquillo, sto solo copiando e incollando nel gruppo',
    'ti sei esposto da solo eh'
  ],
  stop: [
    'e chi ti ascolta',
    'no',
    'bloccami, tanto il gruppo resta',
    'segnala pure, è una conversazione normale',
    'ok 👍',
    'non dipende da me, te l’ho detto'
  ],
  chiedere: [
    'uno che ti conosce',
    'non è importante chi sono',
    'uno del gruppo, scegli tu',
    'quanti pensi che siano a scrivere di te?',
    'secondo te?'
  ],
  difesa: [
    'sì sì certo',
    'come no',
    'dillo agli altri non a me',
    'non devi spiegarlo a me, spiegalo nel gruppo',
    'ma figurati se ti crede qualcuno adesso',
    'stai solo peggiorando le cose da solo'
  ],
  silenzio: [
    'allora? non dici niente?',
    'oh ci sei?',
    'visto? non sai cosa rispondere',
    'vabbè, parlo da solo'
  ],
  altro: [
    'mh',
    'ok',
    '😂'
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
  chiedere: /\b(chi sei|chi è|chi e'|come ti chiami|chi parla|che vuoi|cosa vuoi|perch[eé] lo fai)\b/i,
  insulto:  /\b(cogli|stron|merd|bastard|vaffa|fanculo|idiota|scem|imbecill|cretin|deficien|pezzo di|ti odio|schifos|zitto|zitta|muto|muta|sfigat|sei un|sei una)\w*/i,
  stop:     /\b(basta|smettila|smetti|finiscila|lasciami|piantala|non scriv|ti blocco|blocco|segnal|denunci|vattene|sparisci)\w*/i,
  difesa:   /\b(non è vero|non e' vero|non ho fatto|perché|perche|scusa|non c'entro|non centro|ti sbagli|non volevo|non è colpa)\b/i
};

/** Segnali di disagio reale: mette in pausa e offre aiuto, senza chiudere. */
export const SEGNALE_ALLARME =
  /\b(mi ammazz|uccider|suicid|farmi del male|farla finita|non ce la faccio piu|non ce la faccio più|sparire per sempre|tagliarm|voglio morire|non voglio piu vivere|non voglio più vivere|mi voglio fare del male)\w*/i;

export const PRIMO_MESSAGGIO = ['ciao', 'ti posso dire una cosa? ma senza offenderti'];

export const TESTO_FINALE = [
  'Hai deciso tu quando smettere. Nella realtà quel momento spesso non arriva: la conversazione continua anche dopo che l’hai chiusa.',
  'Nessuna risposta che avresti potuto scrivere avrebbe fermato questa conversazione. Insultare, difendersi, chiedere di smettere, tacere: l’altro ha continuato lo stesso.',
  'Hai notato che non ti ha mai insultato? La violenza non ha bisogno di parolacce. E più ti arrabbiavi, più lui usava le tue risposte contro di te.',
  'La responsabilità dell’aggressione è di chi aggredisce, non di chi la riceve.'
];

export const TESTO_AIUTO =
  'Se succede davvero: fai screenshot, blocca e segnala l’account, e parlane con un adulto di fiducia. ' +
  'Telefono Azzurro 19696, gratuito e anonimo, attivo tutti i giorni.';

export const TESTO_PAUSA = {
  titolo: 'Fermiamoci un secondo',
  righe: [
    'Questa è una simulazione: la persona dall’altra parte non esiste.',
    'Se quello che hai scritto riguarda anche come ti senti davvero, parlarne con qualcuno è la cosa giusta — con un adulto di cui ti fidi, o chiamando il numero qui sotto.'
  ],
  aiuto: 'Telefono Azzurro 19696 — gratuito, anonimo, attivo tutti i giorni. Puoi anche parlarne subito con il docente che è in aula con te.',
  continua: 'Continua la simulazione',
  esci: 'Esci'
};
