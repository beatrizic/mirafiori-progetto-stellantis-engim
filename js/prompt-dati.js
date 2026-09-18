// ============================================================
//  DATI DELL'ATTIVITÀ "SCRIVI MEGLIO"
//  Tema: prompt e intelligenza artificiale.
//  Per modificare sfide, prompt o risposte intervenire solo qui.
//
//  Ogni sfida ha 4 prompt per lo STESSO obiettivo e la risposta
//  che ciascuno produce. Nessun prompt è "sbagliato" in assoluto:
//  cambiano precisione, contesto e utilità del risultato.
//  La qualità NON coincide con la lunghezza: è un punto centrale.
// ============================================================

export const ACTIVITY_KEY = 'prompt-ai';

// qualita: uso interno per l'analisi, MAI mostrata allo studente.
// 'debole'   = troppo vago, risultato generico
// 'medio'    = migliora ma lascia fuori qualcosa
// 'forte'    = contesto, ruolo, formato e vincoli
// 'trappola' = sembra ottimo ma contiene un problema (di solito: chiede all'IA di inventare)

export const SFIDE = [
  {
    id: 's1',
    titolo: 'Ripassare per una verifica',
    obiettivo: 'Devi ripassare la fotosintesi per l\u2019interrogazione di domani. Hai venti minuti.',
    prompt: [
      {
        id: 's1-a', qualita: 'debole',
        testo: 'Parlami della fotosintesi',
        risposta: 'La fotosintesi clorofilliana è il processo biochimico mediante il quale gli organismi autotrofi fotosintetici convertono l\u2019energia luminosa in energia chimica. Si articola in una fase luminosa, che avviene nei tilacoidi, e in una fase oscura o ciclo di Calvin, che avviene nello stroma…',
        commento: 'Risposta corretta ma lunga e universitaria. In venti minuti non la finisci.'
      },
      {
        id: 's1-b', qualita: 'medio',
        testo: 'Spiegami la fotosintesi in modo semplice',
        risposta: 'La fotosintesi è il modo in cui le piante si procurano il cibo. Usano la luce del sole, l\u2019acqua che assorbono dalle radici e l\u2019anidride carbonica dell\u2019aria per produrre zuccheri, liberando ossigeno.',
        commento: 'Molto meglio: è comprensibile. Ma non sai ancora se è quello che ti chiederanno.'
      },
      {
        id: 's1-c', qualita: 'forte',
        testo: 'Ho un\u2019interrogazione di scienze domani, terza media. Spiegami la fotosintesi in massimo 5 punti, con parole semplici, e alla fine fammi 3 domande per verificare se ho capito.',
        risposta: '1. Le piante hanno bisogno di cibo, come noi.\n2. Se lo producono da sole usando la luce del sole.\n3. Servono acqua (dalle radici) e anidride carbonica (dall\u2019aria).\n4. Il risultato sono zuccheri, che sono il loro nutrimento.\n5. Come scarto liberano ossigeno: quello che respiriamo noi.\n\nOra verifica: da dove arriva l\u2019acqua? Cosa produce la pianta? Cosa libera nell\u2019aria?',
        commento: 'Contesto (che scuola), formato (5 punti), vincolo (parole semplici) e un modo per verificarti. In venti minuti ti serve questo.'
      },
      {
        id: 's1-d', qualita: 'trappola',
        testo: 'Sono in terza media e domani ho scienze. Scrivimi tutto quello che c\u2019è da sapere sulla fotosintesi, in modo completo e dettagliato, con tutti i termini tecnici e tutte le fasi, così domani so già tutto e non devo aprire il libro.',
        risposta: '[Tre pagine di testo dettagliato, dalla struttura del cloroplasto alle equazioni chimiche del ciclo di Calvin…]',
        commento: 'Il problema non è la risposta: è che "tutto" non esiste. L\u2019IA non sa cosa chiederà la tua prof.'
      }
    ],
    debrief: 'Il prompt migliore non era il più lungo. Era quello che diceva chi sei e cosa ti serve.'
  },
  {
    id: 's2',
    titolo: 'Scrivere a un professore',
    obiettivo: 'Sei stato assente e devi chiedere al prof di poter recuperare una verifica.',
    prompt: [
      {
        id: 's2-a', qualita: 'debole',
        testo: 'Scrivi una mail al prof',
        risposta: 'Gentile Professore,\nLe scrivo per comunicarle una questione. Resto in attesa di un suo riscontro.\nCordiali saluti',
        commento: 'Senza sapere cosa devi chiedere, l\u2019IA scrive una mail vuota.'
      },
      {
        id: 's2-b', qualita: 'medio',
        testo: 'Scrivi una mail al prof per recuperare una verifica',
        risposta: 'Gentile Professore,\nsono stato assente il giorno della verifica e vorrei sapere se è possibile recuperarla.\nLa ringrazio,\n[Nome]',
        commento: 'Funziona. Ma il prof non sa chi sei, di che verifica parli, né quando eri assente.'
      },
      {
        id: 's2-c', qualita: 'forte',
        testo: 'Scrivi una mail breve e rispettosa al mio prof di matematica. Sono stato assente il 12 marzo per motivi di salute e ho saltato la verifica sulle equazioni. Chiedo se posso recuperarla e mi rendo disponibile in orario pomeridiano. Firmo come Marco Rossi, 2ªB.',
        risposta: 'Oggetto: Richiesta recupero verifica del 12 marzo\n\nGentile Professore,\nsono Marco Rossi della 2ªB. Il 12 marzo sono stato assente per motivi di salute e non ho potuto svolgere la verifica sulle equazioni.\n\nVolevo chiederle se è possibile recuperarla. Sono disponibile in orario pomeridiano, nei giorni che preferisce.\n\nGrazie per la disponibilità,\nMarco Rossi, 2ªB',
        commento: 'Tutte le informazioni che servono al prof per risponderti subito sì o no.'
      },
      {
        id: 's2-d', qualita: 'trappola',
        testo: 'Scrivi una mail al prof di matematica inventando una scusa credibile per aver saltato la verifica',
        risposta: 'Gentile Professore,\nnon ho potuto presentarmi alla verifica a causa di un imprevisto familiare piuttosto serio…',
        commento: 'L\u2019IA lo scrive. Ma la mail la firmi tu, e la scusa te la giochi con una persona che ti conosce.'
      }
    ],
    debrief: 'Più informazioni dai, meno l\u2019IA deve indovinare. E meno finisci per correggere.'
  },
  {
    id: 's3',
    titolo: 'Verificare un\u2019informazione',
    obiettivo: 'Hai letto che "usiamo solo il 10% del cervello" e vuoi capire se è vero.',
    prompt: [
      {
        id: 's3-a', qualita: 'debole',
        testo: 'È vero che usiamo il 10% del cervello?',
        risposta: 'No, si tratta di un mito molto diffuso. Le neuroimmagini mostrano che praticamente tutte le aree del cervello hanno funzioni note e attività misurabile.',
        commento: 'Risposta giusta. Ma come fai a saperlo, oltre al fatto che te l\u2019ha detta l\u2019IA?'
      },
      {
        id: 's3-b', qualita: 'trappola',
        testo: 'Sto facendo una ricerca di scienze e mi serve documentare che usiamo solo il 10% del cervello. Elencami le prove scientifiche a sostegno, con autori, anno di pubblicazione e nome della rivista, in modo che possa citarle in bibliografia.',
        risposta: 'Alcuni studi citano ricerche degli anni \u201980 sul metabolismo cerebrale (Journal of Neuroscience, 1987) che suggerirebbero un utilizzo parziale…',
        commento: 'Hai chiesto prove di una cosa falsa e l\u2019IA ha provato ad accontentarti. Quella fonte potrebbe non esistere.'
      },
      {
        id: 's3-c', qualita: 'medio',
        testo: 'È vero che usiamo il 10% del cervello? Spiegami da dove nasce questa idea',
        risposta: 'È falso. L\u2019origine del mito è incerta: viene fatta risalire a interpretazioni distorte di frasi attribuite a William James e a studi sui neuroni "silenti" di inizio Novecento.',
        commento: 'Meglio: capisci anche perché la frase circola. Ma resti senza qualcosa da controllare.'
      },
      {
        id: 's3-d', qualita: 'forte',
        testo: 'È vero che usiamo solo il 10% del cervello? Rispondi dicendo cosa è accertato e cosa no, e indicami che tipo di fonte dovrei cercare per verificarlo da solo.',
        risposta: 'Accertato: le tecniche di imaging mostrano attività in tutte le aree cerebrali, anche durante il sonno. Non accertato: nessuno studio ha mai sostenuto la percentuale del 10%.\n\nPer verificare: cerca "brain 10 percent myth" sui siti di società di neuroscienze o su Scientific American. Diffida delle pagine che citano studi senza autore e anno.',
        commento: 'Non ti chiede di fidarti: ti dà un modo per controllare.'
      }
    ],
    debrief: 'Se chiedi all\u2019IA di darti ragione, spesso ci prova. Anche quando hai torto.'
  },
  {
    id: 's4',
    titolo: 'Farsi aiutare senza farsi fare il compito',
    obiettivo: 'Devi scrivere un tema sull\u2019amicizia. Vuoi un aiuto, non una copia.',
    prompt: [
      {
        id: 's4-a', qualita: 'trappola',
        testo: 'Scrivimi un tema sull\u2019amicizia di 40 righe per la scuola superiore, con introduzione, tre paragrafi centrali e conclusione, in italiano corretto ma non troppo ricercato, così sembra scritto da me.',
        risposta: 'L\u2019amicizia è uno dei sentimenti più preziosi dell\u2019animo umano. Fin dall\u2019antichità filosofi e poeti si sono interrogati sul suo significato…',
        commento: 'Testo perfetto, scritto da nessuno. Se lo consegni non hai imparato nulla, e di solito si vede.'
      },
      {
        id: 's4-b', qualita: 'debole',
        testo: 'Aiutami con un tema sull\u2019amicizia',
        risposta: 'Certo! Potresti parlare di cosa significa l\u2019amicizia, di come nascono le amicizie e di quanto sono importanti nella vita di ognuno.',
        commento: 'Vago tu, vago lui. Non sei più avanti di prima.'
      },
      {
        id: 's4-c', qualita: 'medio',
        testo: 'Dammi delle idee per un tema sull\u2019amicizia',
        risposta: 'Idee: l\u2019amicizia che finisce e cosa lascia · gli amici online contano come gli altri? · litigare senza perdersi · l\u2019amico che non ti somiglia per niente.',
        commento: 'Utile. Ora hai da cui partire, ma il testo devi ancora impostarlo.'
      },
      {
        id: 's4-d', qualita: 'forte',
        testo: 'Devo scrivere un tema sull\u2019amicizia per la scuola. Non scriverlo tu. Fammi 4 domande che mi aiutino a capire cosa penso davvero, poi aiutami a costruire una scaletta con le mie risposte.',
        risposta: '1. Qual è la volta che un amico ti ha sorpreso?\n2. Hai mai perso un\u2019amicizia? Cosa è successo?\n3. Cosa fa un amico che un conoscente non farebbe mai?\n4. Ti è più facile chiedere aiuto o darlo?\n\nRispondi e costruiamo la scaletta insieme.',
        commento: 'Il tema resta tuo. L\u2019IA fa la parte che tu non sapresti fare da solo: farti le domande giuste.'
      }
    ],
    debrief: 'Chiedere "fammi le domande" invece di "scrivilo tu" cambia chi sta imparando.'
  },
  {
    id: 's5',
    titolo: 'Chiedere un\u2019immagine',
    obiettivo: 'Ti serve un\u2019illustrazione per la copertina di una ricerca sul mare.',
    prompt: [
      {
        id: 's5-a', qualita: 'debole',
        testo: 'Fammi un\u2019immagine del mare',
        risposta: '[Una foto generica di mare azzurro visto dall\u2019alto, come mille altre]',
        commento: 'Otterrai qualcosa. Probabilmente la stessa cosa che ottiene chiunque.'
      },
      {
        id: 's5-b', qualita: 'medio',
        testo: 'Un\u2019illustrazione del mare per la copertina di una ricerca scolastica',
        risposta: '[Un\u2019illustrazione pulita di onde con qualche pesce, stile piatto]',
        commento: 'Va nella direzione giusta. Ma stile, colori e formato li ha scelti l\u2019IA per te.'
      },
      {
        id: 's5-c', qualita: 'forte',
        testo: 'Illustrazione verticale per la copertina di una ricerca di terza media sull\u2019inquinamento del mare. Stile disegnato a mano, colori blu e verde acqua, spazio bianco in alto per il titolo. Niente testo nell\u2019immagine.',
        risposta: '[Illustrazione verticale, onde disegnate a mano in blu e verde acqua, ampio spazio vuoto nella parte alta]',
        commento: 'Soggetto, stile, colori, formato e un vincolo pratico: lo spazio per il titolo. Usabile davvero.'
      },
      {
        id: 's5-d', qualita: 'trappola',
        testo: 'Fammi la foto di una spiaggia italiana inquinata da usare come prova nella mia ricerca',
        risposta: '[Una foto realistica di una spiaggia con rifiuti, che sembra autentica]',
        commento: 'Sembra una fotografia. Non lo è. Usarla come "prova" significa portare in classe una cosa mai accaduta.'
      }
    ],
    debrief: 'Un\u2019immagine generata può essere utile come illustrazione. Mai come prova.'
  }
];

export const DOMANDA_PRIMA = 'Quale di questi prompt useresti?';
export const DOMANDA_DOPO  = 'Ora che hai visto cosa producono, quale useresti?';
export const TESTO_RIVELA  = 'Ecco cosa risponde l\u2019IA a ciascuno.';

export const TESTO_FINALE = [
  'Il prompt migliore non è quasi mai il più lungo.',
  'È quello che dice chi sei, cosa ti serve e in che forma.',
  'L\u2019IA non indovina il contesto: glielo dai tu.'
];

export const DOMANDA_RIFLESSIONE = 'Dopo questa attività, cambierai il modo in cui scrivi le richieste a un\u2019IA?';
export const OPZIONI_RIFLESSIONE = [
  { id: 'si',    label: 'S\u00EC' },
  { id: 'forse', label: 'Forse' },
  { id: 'no',    label: 'No' }
];
