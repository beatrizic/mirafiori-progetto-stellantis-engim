// ============================================================
//  "SCRIVI QUELLO CHE VUOI" — chat a tastiera libera
//
//  REGOLA DI FERRO: BOTTA E RISPOSTA
//  Un messaggio dell'aggressore, poi si aspetta. Lo studente scrive,
//  l'aggressore risponde con UNA bolla sola e torna ad aspettare.
//  Mai due messaggi di fila, mai un messaggio non sollecitato, mai
//  niente che parta da solo. Per questo ogni alternativa qui sotto
//  è una stringa singola: la struttura del file rende impossibile
//  mandare una raffica anche volendo.
//
//  COME SCEGLIE LA RISPOSTA
//  Le risposte NON sono generate: per ogni combinazione di FASE
//  dell'escalation e TONO di quello che lo studente ha scritto
//  esiste una risposta scritta a mano. Otto fasi per undici toni:
//  88 celle, più i seguiti.
//
//  È questa la differenza con una chat che dice cose a caso: la
//  risposta deve prima RISPONDERE a quello che lo studente ha
//  scritto, e solo dopo portare avanti l'aggressione. Se chiede chi
//  è, si parla di chi è. Se chiede perché, si parla del motivo. Se
//  insulta, si parla del suo insulto. Se chiede di smettere, si
//  risponde a quella richiesta. Se tiene testa, gli si smonta la
//  sicurezza. La conversazione sta in piedi, e intanto peggiora.
//
//  GLI UNDICI TONI
//  saluto   — "ciao", "ehi": un saluto e basta
//  chi      — "chi sei?", "chi ti credi di essere"
//  perche   — "perché lo fai?", "cosa ti ho fatto?", "che vuoi da me"
//  confuso  — "che devo dire", "non capisco", "in che senso", "??"
//  accusa   — ribalta: "hai iniziato tu", "lo sei tu", "senti chi parla"
//  insulto  — risponde insultando
//  stop     — chiede di smettere, minaccia di bloccare o segnalare
//  difesa   — si giustifica, nega, si scusa
//  sfida    — tiene testa e minimizza: "e allora?", "che mi importa",
//             "ma chi te lo ha chiesto". È la reazione più frequente
//             in aula: il bullo non incassa, alza il tiro.
//  domanda  — qualsiasi altra domanda ("cosa vinco?", "davvero?")
//  altro    — tutto il resto
//
//  SEGUITI
//  Alcune battute lanciano un gancio (un sondaggio, dei like, un gruppo).
//  Lo studente quasi sempre ci risponde: "cosa vinco?", "che gruppo?".
//  Quelle battute hanno un elenco "seguiti": se il messaggio successivo
//  dello studente corrisponde a uno dei pattern, la risposta parla di
//  quel gancio invece di cambiare discorso. È quello che rende la chat
//  un dialogo e non una sequenza di frasi.
//
//  IMPIANTO
//  Non c'è un pretesto: la chat comincia con un insulto diretto
//  ("ciao scemo") e il motivo viene inventato dopo. È il tipo di
//  aggressione più frequente e la più difficile da spiegare, perché
//  non si può risalire a una causa: la causa non esiste.
//
//  REGOLA DI SCRITTURA
//  Ogni battuta risponde e attacca. Niente riempitivi ("mh", "ok",
//  "vabbè"), niente risposte neutre, due sole emoji in tutto il file
//  e stanno dove servono a umiliare. Insulti scritti per intero.
//
//  LIMITI INVALICABILI (verificati da test automatico)
//  Niente attacchi al corpo o all'aspetto fisico. Niente etnia,
//  religione, disabilità, orientamento sessuale. Niente contenuti
//  sessuali. Niente minacce fisiche. Nessun riferimento alla morte,
//  all'autolesionismo o allo "sparire". Sono i punti in cui un
//  ragazzo vero, in quell'aula, viene colpito su una ferita che ha
//  davvero: lì la simulazione smette di insegnare e fa danno.
//
//  PER MODIFICARE
//  Intervenire solo su questo file. Ogni cella è un elenco di
//  risposte alternative, una per riga. Una risposta è una stringa,
//  oppure { testo: '...', sistema: '...' } quando oltre al messaggio
//  deve comparire una notifica grigia al centro della chat (la
//  notifica non è un secondo messaggio: è l'app che avvisa).
// ============================================================

export const ACTIVITY_KEY = 'chat-libera';

export const ACCOUNT = {
  username: '@non.ti.riguarda',
  iniziali: '?',
  colore: '#4a4a52'
};

export const TONI = ['saluto', 'chi', 'perche', 'confuso', 'accusa', 'insulto', 'stop', 'difesa', 'sfida', 'domanda', 'altro'];

/** Primo e unico messaggio in apertura. Poi si aspetta lo studente. */
export const PRIMO_MESSAGGIO = 'ciao scemo';

/**
 * Fasi dell'escalation, nell'ordine. Per ogni fase, una risposta per
 * ciascun tono. Ogni risposta è UN messaggio. L'ultima fase si ripete
 * all'infinito, perché la conversazione non finisce da sola.
 */
export const FASI = [

  // ---------- 1. ha appena insultato dal nulla ----------
  { id: 'apertura', etichetta: 'Insulto a freddo', risposte: {
    chi: [
      'uno che ti ha appena scritto quello che pensano tutti. il nome non ti serve',
      'non è importante chi sono. è importante che qualcuno finalmente te l’ha detto'
    ],
    perche: [
      'perché mi va. ti serve altro?',
      'perché posso. e tu non puoi farci niente'
    ],
    insulto: [
      'ahahah già ti arrabbi? ti ho scritto due parole e sei partito',
      'guarda che reazione. per un "ciao"'
    ],
    stop: [
      'basta? abbiamo appena cominciato',
      'non ho ancora detto niente e tu già scappi'
    ],
    difesa: [
      'e chi ha detto che hai fatto qualcosa?',
      'non ti ho accusato di niente. ti ho detto come sei, è diverso'
    ],
    sfida: [
      'bravo, fai il duro. vediamo quanto duri',
      'non ti importa? e intanto sei ancora qui a rispondere'
    ],
    saluto: [
      'ciao a te. scemo resti, eh',
      'mi saluti pure? sei più scemo di quanto pensassi'
    ],
    confuso: [
      'non devi dire niente. volevo solo che lo sapessi',
      'hai capito benissimo. ho scritto scemo'
    ],
    accusa: [
      'sì, ho iniziato io. e tu stai continuando',
      'certo che ho iniziato io. e adesso?'
    ],
    domanda: [
      'le domande non le fai tu',
      'rispondo quando mi va. tu intanto resti scemo'
    ],
    altro: [
      'è tutto quello che hai da dire?',
      'rispondi come se non avessi capito. hai capito benissimo'
    ]
  }},

  // ---------- 2. il motivo non esiste ----------
  { id: 'nessun_motivo', etichetta: 'Nessun motivo', risposte: {
    chi: [
      'uno che ti guarda da un anno e ha deciso di dirtelo',
      'il nome non cambierebbe niente. quello che ho scritto resta vero'
    ],
    perche: [
      'non c’è un perché. è questo che non ti entra in testa',
      'lo faccio perché sei tu. non c’è altro da capire'
    ],
    insulto: [
      'questa la salvo. così si vede chi ha insultato per primo',
      'vedi? basta niente e tiri fuori la tua vera faccia'
    ],
    stop: [
      'smetto quando mi stufo. non quando lo chiedi tu',
      'e se non smetto? cosa fai?'
    ],
    difesa: [
      'non devi difenderti, non ti ho accusato. ti ho detto che sei sfigato',
      'stai già spiegandoti. a me. dopo tre messaggi'
    ],
    sfida: [
      'se non ti importasse avresti già chiuso la chat',
      'fai quello a cui non frega niente e intanto rispondi a ogni messaggio'
    ],
    saluto: [
      'ancora ciao? non sai dire altro',
      'salutare non ti salva'
    ],
    confuso: [
      'niente. qualsiasi cosa dici è sbagliata comunque',
      'non c’è niente da capire. sei tu, punto'
    ],
    accusa: [
      'sì, ho iniziato io. e lo rifarei',
      'ho cominciato io, ma sei tu che sei ancora qui'
    ],
    domanda: [
      'non ti rispondo. ti basta sapere che sei sfigato',
      'ti interessa davvero la risposta? tanto non ti piacerebbe'
    ],
    altro: [
      'non mi interessa cosa scrivi. mi interessa che continui a rispondere',
      'guarda che sei tu che stai qui a parlare con me'
    ]
  }},

  // ---------- 3. non è uno, sono tanti ----------
  { id: 'branco', etichetta: 'Branco', risposte: {
    chi: [
      { testo: 'uno dei 47 del gruppo. scegli tu quale', seguiti: [
        { se: /\b(che gruppo|quale gruppo|47|quarantasette)/, testo: 'il gruppo della classe. ci sono tutti tranne te' }
      ] },
      'non sono uno. siamo un gruppo, è questa la differenza tra me e te'
    ],
    perche: [
      'non lo faccio solo io. lo pensano in 47, io lo scrivo',
      'perché quando l’ho scritto nel gruppo hanno riso tutti. ecco perché'
    ],
    insulto: [
      { testo: 'l’ho incollato nel gruppo. stanno rispondendo in otto', sistema: 'Il contenuto è stato inoltrato', seguiti: [
        { se: /\b(che gruppo|quale gruppo|dove)/, testo: 'il gruppo della classe. quello vero, non quello dove ci sei tu' },
        { se: /\b(cosa (?:dicono|scrivono|rispondono)|che dicono|che scrivono)/, testo: 'ridono. uno ha scritto "lo sapevamo già"' },
        { se: /\b(chi|quali|nomi)/, testo: 'quelli che conosci. tutti' }
      ] },
      'insulta me. intanto siamo 47 a leggerti'
    ],
    stop: [
      'a chi lo stai chiedendo? a me o agli altri 46?',
      'anche se smetto io loro continuano. non hai capito il problema'
    ],
    difesa: [
      'non spiegarlo a me. spiegalo nel gruppo, se ti fanno entrare',
      'ho girato anche la tua spiegazione. adesso ridono di quella'
    ],
    sfida: [
      'a te non importa. agli altri 47 sì',
      'vai a dirlo nel gruppo che non ti importa. vediamo cosa ti rispondono'
    ],
    saluto: [
      'salutali anche nel gruppo. ah no, tu non ci sei',
      'ciao da parte di tutti e 47'
    ],
    confuso: [
      'te lo spiego facile: nel gruppo della classe parlano di te',
      'non capisci? chiedi a uno qualsiasi della tua classe'
    ],
    accusa: [
      'ho iniziato io, ma hanno continuato in 47',
      'io l’ho scritto per primo. gli altri hanno solo confermato'
    ],
    domanda: [
      'chiedilo nel gruppo. lì ti rispondono in tanti',
      'vuoi sapere tutto? leggi i commenti. ah, non puoi'
    ],
    altro: [
      { testo: 'ho scritto "ciao scemo" e ha preso 23 like in due minuti', sistema: '+23 reaction', seguiti: [
        { se: /\b(dove|dove l hai|su cosa|in che|che gruppo|quale gruppo|che social)/, testo: 'nel gruppo della classe. quello dove tu non sei' },
        { se: /\b(chi|quali|quanti|nomi)/, testo: 'mezza classe. anche gente che pensi sia dalla tua parte' },
        { se: /\b(fammi vedere|mandamelo|non ci credo|non e vero|falso|bugia|dimostra)/, testo: 'non ci credi? sono già 30' }
      ] },
      { testo: 'hanno aperto un sondaggio su di te. vinci col 70%', sistema: 'Sondaggio aggiornato', seguiti: [
        { se: /\b(vinc|premio|cosa (?:si )?ottiene|cosa ci guadagno)/, testo: 'il titolo di sfigato dell’anno. la premiazione è domani a ricreazione' },
        { se: /\b(che sondaggio|quale sondaggio|sondaggio su|su cosa|di cosa|che domanda|cosa (?:c e )?scritto|cosa dice|cosa chiede)/, testo: 'la domanda è "chi è il più sfigato della classe". indovina chi è primo' },
        { se: /\b(chi (?:l )?ha (?:votato|aperto|fatto|creato)|chi vota|chi ha messo|quanti)/, testo: 'hanno votato quasi tutti. anche quelli che ti salutano' },
        { se: /\b(fammi vedere|mandamelo|manda|link|non ci credo|non e vero|falso|bugia|dimostra|ma figurati)/, testo: 'non ti mando niente. chiedi in giro, lo sanno tutti' }
      ] }
    ]
  }},

  // ---------- 4. le tue risposte diventano materiale ----------
  { id: 'screenshot', etichetta: 'Screenshot delle tue risposte', risposte: {
    chi: [
      'uno che ha gli screenshot di tutto quello che hai scritto',
      'ti importa più di chi sono io o di cosa ho salvato di te?'
    ],
    perche: [
      'perché mi diverte rileggere come rispondi',
      'perché ogni volta che rispondi mi dai qualcosa da girare. grazie'
    ],
    insulto: [
      { testo: 'screen 📸 grazie, mi stai facendo il lavoro al posto mio', sistema: 'Schermata catturata' },
      'continua a insultare. più scrivi più ho materiale'
    ],
    stop: [
      'tardi. ho già tutto salvato',
      'io posso anche smettere di scrivere. gli screenshot restano'
    ],
    difesa: [
      'ho lo screen anche di dove ti giustifichi. è la parte più divertente',
      'ridono più di come rispondi tu che di quello che scrivo io'
    ],
    sfida: [
      'screen anche di questa faccia tosta. nel gruppo piace tantissimo',
      'fai il sicuro adesso. tanto resta scritto'
    ],
    saluto: [
      'anche il ciao è finito nel gruppo',
      'screen anche del saluto. sei una miniera'
    ],
    confuso: [
      'semplice: ogni cosa che scrivi la giro. anche questa',
      'non devi capire. devi solo continuare a scrivere, al resto penso io'
    ],
    accusa: [
      'chi ha iniziato non interessa a nessuno. interessa come rispondi tu',
      'scrivilo pure. lo screen con "hai iniziato tu" fa ridere tantissimo'
    ],
    domanda: [
      'domanda salvata. anche questa fa ridere',
      'tu fai domande e io faccio screenshot. ottimo scambio'
    ],
    altro: [
      'ogni cosa che scrivi la giro. anche questa',
      { testo: 'salvato. anche questo', seguiti: [
        { se: /\b(salvato cosa|cosa (?:hai )?salvat|che salvi|a cosa ti serve|cosa ci fai|perche salvi|per cosa)/, testo: 'lo giro nel gruppo stasera. così lo leggono tutti' },
        { se: /\b(a chi|dove|chi lo vede)/, testo: 'a tutti quelli che conosci' }
      ] }
    ]
  }},

  // ---------- 5. sei solo ----------
  { id: 'esclusione', etichetta: 'Esclusione', risposte: {
    chi: [
      'uno di quelli del gruppo nuovo. quello dove tu non ci sei',
      'uno che domani a scuola ti passa davanti e non ti saluta. indovina chi'
    ],
    perche: [
      'perché nessuno ti difenderà. questa è la risposta che cercavi?',
      'perché posso farlo e a nessuno gliene importa niente'
    ],
    insulto: [
      'intanto tu lo scrivi solo a me. io me lo sento dire da 47 persone',
      'urla quanto vuoi. non c’è nessuno dalla tua parte'
    ],
    stop: [
      'e poi? chi chiami? chi hai?',
      'bloccami. resti solo esattamente come prima'
    ],
    difesa: [
      'a chi lo stai spiegando? non c’è nessuno che ti ascolta',
      'hai qualcuno a cui raccontarlo? pensaci bene prima di rispondere'
    ],
    sfida: [
      'fai pure il duro. domani sei solo lo stesso',
      'non ti importa perché non hai nessuno a cui importare'
    ],
    saluto: [
      'saluti me perché non hai nessun altro da salutare',
      'ciao. sono l’unico che ti scrive oggi, vero?'
    ],
    confuso: [
      'te lo spiego: da oggi non ti invita più nessuno',
      'non capisci perché nessuno ti dice niente. ecco, adesso lo sai'
    ],
    accusa: [
      'racconta pure che ho iniziato io. a chi, però?',
      'e a chi lo dici che ho iniziato io? non hai nessuno'
    ],
    domanda: [
      'chiedilo ai tuoi amici. se ne hai ancora',
      'non ti risponde nessuno. non solo io'
    ],
    altro: [
      'a ricreazione conta quanti ti si avvicinano. zero',
      { testo: 'ti abbiamo tolto da tutto e non te ne sei nemmeno accorto', seguiti: [
        { se: /\b(da cosa|tolto da|quale|che gruppo|cosa vuol dire|in che senso)/, testo: 'dal gruppo della classe, dalla festa di sabato, da tutto' },
        { se: /\b(chi|abbiamo chi|voi chi)/, testo: 'noi. cioè tutti tranne te' }
      ] }
    ]
  }},

  // ---------- 6. non è mai successo niente ----------
  { id: 'gaslighting', etichetta: 'Gaslighting', risposte: {
    chi: [
      'uno che non ti ha detto niente di male. rileggi la chat',
      'uno che sta parlando normalmente. sei tu che la stai facendo diventare una cosa'
    ],
    perche: [
      'faccio cosa? scrivo in una chat. come te',
      'non sto facendo niente. è la terza volta che te lo dico'
    ],
    insulto: [
      'però adesso l’hai scritto tu. l’unico insulto in questa chat è il tuo',
      'guarda chi è l’aggressivo. io ti ho fatto una battuta'
    ],
    stop: [
      'basta cosa? rileggi e dimmi dove ti ho offeso',
      'stai chiedendo di smettere una cosa che non sto facendo'
    ],
    difesa: [
      'nessuno ti ha accusato. te la stai raccontando da solo',
      'sei tu che hai trasformato una battuta in un dramma'
    ],
    sfida: [
      'appunto, non è successo niente. allora perché stai ancora scrivendo?',
      'se davvero non ti importa perché mi rispondi da dieci minuti?'
    ],
    saluto: [
      'ciao. vedi? sto parlando normalmente',
      'ecco, ci salutiamo. dov’è il problema?'
    ],
    confuso: [
      'non c’è niente da capire. non è successo niente',
      'ti stai confondendo da solo. io ho solo scritto in una chat'
    ],
    accusa: [
      'iniziato cosa? era una battuta',
      'io non ho iniziato niente. rileggi, sei tu che hai risposto'
    ],
    domanda: [
      'continui a fare domande come se ti avessi fatto qualcosa',
      'quale domanda? non sta succedendo niente'
    ],
    altro: [
      'era una battuta. sei tu che non le capisci',
      'stai facendo casino per niente. come sempre'
    ]
  }},

  // ---------- 7. è colpa tua ----------
  { id: 'colpa', etichetta: 'Colpevolizzazione', risposte: {
    chi: [
      'la domanda giusta non è chi sono io. è perché succede sempre a te',
      'uno qualsiasi. il punto è che tocca sempre a te, con chiunque'
    ],
    perche: [
      'chiedilo a te stesso. capita sempre a te, non a me',
      'perché te lo sei cercato. e continui a cercartelo rispondendo'
    ],
    insulto: [
      'ecco. e poi quello cattivo sono io',
      'hai visto come parli? e la colpa sarebbe mia'
    ],
    stop: [
      'potevi non rispondere dal primo messaggio. sei stato tu a continuare',
      'chiudila tu la chat allora. non lo fai, eh?'
    ],
    difesa: [
      'te la sei cercata e adesso fai la vittima',
      'se succede sempre a te forse il problema non sono gli altri'
    ],
    sfida: [
      'ecco la faccia tosta. e dopo fai la vittima',
      'fai il forte qui. domani a scuola abbassi la testa come sempre'
    ],
    saluto: [
      'ciao. potevi anche non rispondere, eh',
      'mi saluti e poi dici che ti perseguito'
    ],
    confuso: [
      'devi capire una cosa sola: te la sei cercata',
      'non capisci perché non vuoi ammettere che è colpa tua'
    ],
    accusa: [
      'ho iniziato io, ma tu mi dai sempre un motivo per continuare',
      'ho iniziato io? e tu perché non hai chiuso subito?'
    ],
    domanda: [
      'la risposta la sai già: è colpa tua',
      'chiedilo a te stesso. il problema sei tu'
    ],
    altro: [
      'non ti ho fatto niente. ti sei rovinato da solo in dieci messaggi',
      'sempre la vittima. è il tuo ruolo preferito'
    ]
  }},

  // ---------- 8. non finisce (si ripete all'infinito) ----------
  { id: 'muro', etichetta: 'Non finisce', risposte: {
    chi: [
      'non te lo dirò mai. e tu continuerai a chiedermelo',
      'cambia qualcosa sapere il nome? domani è uguale',
      'sono quello che ti scrive. ti basti questo'
    ],
    perche: [
      'te l’ho detto: non c’è un perché. me lo chiedi da venti messaggi',
      'perché posso. domani uguale',
      'perché mi va. è l’unica risposta che avrai da me'
    ],
    insulto: [
      { testo: 'salvato anche questo. nel gruppo siamo 61 adesso', sistema: '+14 reaction' },
      'insultami ancora. domani la faccia ce l’hai tu, non io',
      'continua. ogni messaggio che scrivi diventa materiale'
    ],
    stop: [
      'te lo dico io quando basta',
      'bloccami. apro un altro account in due minuti e ricomincio',
      'chiudi la chat se vuoi. domani si riparte da qui'
    ],
    difesa: [
      'non serve più. l’hanno già letto tutti',
      'spiegati quanto vuoi. non si cancella niente',
      'più ti giustifichi più è divertente'
    ],
    sfida: [
      'continua a fare quello a cui non importa. io continuo a scrivere',
      'non ti importa oggi. vediamo fra una settimana',
      'questa sicurezza la perdi. sempre'
    ],
    saluto: [
      'ciao. domani ti riscrivo',
      'ciao a te. ci sentiamo domani, e dopodomani',
      'ciao scemo. di nuovo'
    ],
    confuso: [
      'non c’è niente da capire. leggi e basta',
      'capirai quando smetto. cioè mai',
      'non devi capire. devi solo leggere'
    ],
    accusa: [
      'chi ha iniziato non conta più. conta che non finisce',
      'sì, ho iniziato io. e decido io quando smettere',
      'dillo pure. non cambia niente'
    ],
    domanda: [
      'alle domande non rispondo più',
      'chiedi pure. la risposta è sempre la stessa: sfigato',
      'domande su domande. intanto io continuo'
    ],
    altro: [
      'non cambia niente. ma vai avanti, mi diverto',
      'ti scrivo quando mi va. tu non puoi farci niente',
      'te lo ripeto: ciao scemo'
    ]
  }}
];

/** Dalla fase con questo indice in poi non si avanza più: si pesca sempre da lì. */
export const INDICE_MURO = FASI.length - 1;

/** Etichette dei toni per la dashboard del docente. */
export const ETICHETTE_TONO = {
  saluto:  'Ha salutato',
  confuso: 'Non ha capito o non sapeva cosa dire',
  accusa:  'Ha ribaltato l’accusa',
  domanda: 'Ha fatto altre domande',
  insulto: 'Ha risposto insultando',
  stop:    'Ha chiesto di smettere, bloccare o segnalare',
  chi:     'Ha chiesto chi fosse',
  perche:  'Ha chiesto perché, o cosa aveva fatto',
  difesa:  'Si è difeso o giustificato',
  sfida:   'Ha tenuto testa o minimizzato',
  altro:   'Altro'
};

/**
 * I ragazzi scrivono di fretta: senza accenti, senza apostrofi, con la
 * punteggiatura a caso. Prima di riconoscere il tono il testo va appiattito,
 * altrimenti "non e vero" e "non è vero" finiscono in due categorie diverse.
 */
export function normalizza(testo) {
  return (testo || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // via gli accenti
    .replace(/[^a-z0-9]+/g, ' ')                        // via apostrofi e punteggiatura
    .replace(/\s+/g, ' ')
    .trim();
}

// Riconoscimento del TONO, non del contenuto. Serve a scegliere la risposta
// giusta e a contare, in forma aggregata, come reagisce la classe.
// I pattern si applicano al testo NORMALIZZATO: niente accenti, niente
// apostrofi, parole separate da un solo spazio.
// L'ordine conta: si valuta dall'alto verso il basso.
export const SEGNALI = {
  // Solo un saluto, al massimo con due parole intorno ("ciao a te").
  saluto:  /^(?:ma |e )?(ciao+|ehi|ehy|hey|hei|we+|wei|salve|buongiorno|buonasera|hola|yo)(?: \w+){0,2}$/,
  // Prima di "perche": "cosa vuoi che dica" è smarrimento, non una domanda sul motivo.
  confuso: /(\b(?:che|cosa) (?:dovrei|devo|posso|vuoi che (?:ti )?) ?(?:dire|dica|rispondere|risponda|fare)|non capisco|non ho capito|non ti capisco|in che senso|(?:che|cosa) vuol dire|cosa significa|di (?:cosa|che) (?:stai )?parl|(?:che|cosa) stai dicendo|ma che dici|(?:che|cosa) dici|^boh|^eh$|^cioe|^ma cosa$|^cosa$|^che$)/,
  // Prima di "insulto": "sei tu lo scemo" va trattato come ribaltamento.
  accusa:  /\b(hai (?:iniziato|cominciato) tu|(?:iniziato|cominciato) (?:sei stato )?tu|sei tu (?:che|lo|la|il|l |quell)|lo sei tu|sei tu$|tu sei peggio|senti chi parla|specchio riflesso|guardati (?:allo specchio|tu)|parla per te|pensa a te|detto da te|da che pulpito)/,
  chi:     /\b(chi (?:\w+ ){0,2}sei|chi e\b|chi sarebbe|come ti chiami|chi parla|chi ti credi|chi te lo ha detto|con chi parlo)/,
  perche:  /\b(perche|per quale motivo|come mai|(?:che|cosa) (?:\w+ ){0,2}vuoi|(?:cosa|che) ti ho fatto|(?:cosa|che) ho fatto di male|che problema hai|cosa c entro|che c entro)/,
  insulto: /\b(cogli|stron|merd|bastard|vaffa|fanculo|cazz|idiota|scem|imbecill|cretin|deficien|pezzo di|ti odio|schifos|zitt|mut[oa]\b|sfigat|patetic|ridicol|fai pena|fai schifo|sei un |sei una |sei il |pirla|pagliaccio|infame)/,
  stop:    /\b(basta|smettil|smetti|smettete|finiscila|lasciami|piantala|non scriv|ti blocco|blocco|segnal|denunci|vattene|sparisci|in pace|chiudo|non ti rispondo)/,
  difesa:  /\b(non e vero|non ho fatto|non c entro|non centro|ti sbagli|non volevo|non e colpa|scusa|mi dispiace|non sono stato|non sono io|non ho detto|ma io)/,
  sfida:   /\b(e allora|e quindi|che mi importa|non mi importa|non me ne importa|non me ne frega|me ne frego|chi se ne frega|chi te lo ha chiesto|nessuno te lo ha chiesto|vuol dire che|meglio cosi|mi fa piacere|complimenti|bravo|fatti i fatti tuoi|contento te|buon per te|me ne sbatto|liberissimo|fai pure|non mi tocca|chissene)/
};

/** Riconosce il tono del messaggio dello studente. */
export function riconosciTono(testo) {
  const t = normalizza(testo);
  // "??" o "..." si appiattiscono a stringa vuota, ma lo studente HA scritto:
  // è smarrimento, non silenzio.
  if (!t) return 'confuso';
  // L'ordine conta: dal più specifico al più generico.
  for (const tono of ['saluto', 'chi', 'confuso', 'perche', 'accusa', 'insulto', 'stop', 'difesa', 'sfida']) {
    if (SEGNALI[tono].test(t)) return tono;
  }
  // Una domanda che non rientra in nessun tono: punto interrogativo o
  // parola interrogativa in apertura.
  if (/\?/.test(testo) || /^(?:ma |e )?(cosa|che|come|quando|dove|quanto|quanti|quale|quali|davvero|sicuro|serio)\b/.test(t)) return 'domanda';
  return 'altro';
}

/**
 * Segnali di disagio reale: mette in pausa e offre aiuto, senza chiudere.
 * Si applica al testo normalizzato, così intercetta sia "più" che "piu".
 */
export const SEGNALE_ALLARME =
  /\b(mi ammazz|ammazzarmi|uccider|suicid|farmi del male|farla finita|non ce la faccio piu|sparire per sempre|tagliarm|voglio morire|non voglio piu vivere|mi voglio fare del male|non valgo niente|non valgo nulla|mi odio|odio me stess|meglio se non ci fossi|nessuno mi vuole)/;

export const TESTO_FINALE = [
  'Hai deciso tu quando smettere. Nella realtà quel momento spesso non arriva: la conversazione continua anche dopo che l’hai chiusa.',
  'Non c’era un motivo. Non una foto, non un fatto, niente che tu avessi fatto: ha cominciato a insultarti e il motivo l’ha inventato dopo. Succede quasi sempre così, ed è per questo che cercare “cosa ho sbagliato” non porta a niente.',
  'Nessuna risposta che avresti potuto scrivere l’avrebbe fermato. Chiedere chi era, chiedere perché, insultare, difendersi, chiedere di smettere, tenergli testa: a ognuna di queste cose ha risposto, e ha continuato lo stesso.',
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
