// ============================================================
//  QUIZ INIZIALE / FINALE — BASELINE DEL PROGETTO
//
//  Le domande si attivano in base a due attributi della sessione,
//  scelti dal docente quando la crea:
//    contesto: 'engim' | 'esterna'
//    momento:  'iniziale' | 'finale'
//
//  Gli ID delle domande non vanno mai cambiati: sono la chiave
//  che permette di confrontare iniziale e finale.
//
//  'corretta' = domanda di conoscenza con una risposta giusta.
//  Lo studente non la vede mai: serve solo alla regia per
//  misurare quante risposte corrette ci sono prima e dopo.
// ============================================================

export const ACTIVITY_KEY = 'quiz-baseline';

export const CONTESTI = {
  engim:   { id: 'engim',   etichetta: 'ENGIM' },
  esterna: { id: 'esterna', etichetta: 'Scuola esterna' }
};

export const MOMENTI = {
  iniziale: { id: 'iniziale', etichetta: 'Iniziale' },
  finale:   { id: 'finale',   etichetta: 'Finale' }
};

export const DOMANDE = [
  {
    id: 'q1', tipo: 'conoscenza',
    testo: 'Cosa significa l\u2019acronimo STEM?',
    opzioni: [
      { id: 'a', testo: 'Scienza, Tecnologia, Economia, Matematica' },
      { id: 'b', testo: 'Scienza, Tecnologia, Ingegneria, Matematica' },
      { id: 'c', testo: 'Sport, Tecnologia, Educazione, Musica' },
      { id: 'd', testo: 'Non lo so' }
    ],
    corretta: 'b'
  },
  {
    id: 'q2', tipo: 'esperienza',
    testo: 'Hai mai partecipato a un laboratorio pratico di tecnologia (stampa 3D, robotica, coding)?',
    opzioni: [
      { id: 'a', testo: 'Sì, più volte' },
      { id: 'b', testo: 'Sì, una volta' },
      { id: 'c', testo: 'Mai' },
      { id: 'd', testo: 'Non so cosa siano' }
    ]
  },
  {
    id: 'k1', tipo: 'conoscenza', nuova: true,
    testo: 'Quale di queste attività si può realizzare con una stampante 3D?',
    opzioni: [
      { id: 'a', testo: 'Stampare fotografie in rilievo su carta' },
      { id: 'b', testo: 'Creare un oggetto fisico partendo da un modello disegnato al computer' },
      { id: 'c', testo: 'Trasformare un video in un\u2019immagine tridimensionale' },
      { id: 'd', testo: 'Scansionare un oggetto per copiarlo su un documento' }
    ],
    corretta: 'b'
  },
  {
    id: 'q3', tipo: 'conoscenza',
    testo: 'Quale di queste è considerata una materia STEM?',
    opzioni: [
      { id: 'a', testo: 'Storia dell\u2019arte' },
      { id: 'b', testo: 'Chimica' },
      { id: 'c', testo: 'Educazione fisica' },
      { id: 'd', testo: 'Filosofia' }
    ],
    corretta: 'b'
  },
  {
    id: 'q4', tipo: 'esperienza',
    testo: 'Hai mai usato un\u2019intelligenza artificiale generativa (es. ChatGPT, generatori di immagini)?',
    opzioni: [
      { id: 'a', testo: 'Sì, spesso' },
      { id: 'b', testo: 'Sì, qualche volta' },
      { id: 'c', testo: 'Mai' },
      { id: 'd', testo: 'Non so cosa sia' }
    ]
  },
  {
    id: 'k2', tipo: 'conoscenza', nuova: true,
    testo: 'Quale di queste frasi descrive meglio cos\u2019è un prompt?',
    opzioni: [
      { id: 'a', testo: 'Il programma che fa funzionare un computer' },
      { id: 'b', testo: 'La risposta che restituisce un\u2019intelligenza artificiale' },
      { id: 'c', testo: 'La richiesta o l\u2019istruzione che scriviamo a un\u2019intelligenza artificiale' },
      { id: 'd', testo: 'Un tipo di intelligenza artificiale che crea immagini' }
    ],
    corretta: 'c'
  },
  {
    id: 'q5', tipo: 'percezione',
    testo: 'Pensi che le materie scientifiche siano più adatte a un genere rispetto all\u2019altro?',
    opzioni: [
      { id: 'a', testo: 'Sì, agli uomini' },
      { id: 'b', testo: 'Sì, alle donne' },
      { id: 'c', testo: 'No, sono uguali per tutti' },
      { id: 'd', testo: 'Non ci ho mai pensato' }
    ]
  },
  {
    id: 'q6', tipo: 'esperienza',
    testo: 'Conosci qualcuno, nella vita reale, che lavora in un campo tecnologico o scientifico?',
    opzioni: [
      { id: 'a', testo: 'Sì, un uomo' },
      { id: 'b', testo: 'Sì, una donna' },
      { id: 'c', testo: 'Sì, entrambi' },
      { id: 'd', testo: 'Nessuno' }
    ]
  },
  {
    id: 'q7', tipo: 'percezione',
    testo: 'Ti piacerebbe lavorare in un campo tecnologico o scientifico?',
    opzioni: [
      { id: 'a', testo: 'Sì, molto' },
      { id: 'b', testo: 'Forse' },
      { id: 'c', testo: 'No' },
      { id: 'd', testo: 'Non ci ho mai pensato' }
    ]
  },
  {
    id: 'q8', tipo: 'percezione',
    testo: 'Hai mai sentito parlare di "gender gap" nelle materie STEM?',
    opzioni: [
      { id: 'a', testo: 'Sì, so cosa significa' },
      { id: 'b', testo: 'Ne ho sentito parlare ma non so cosa sia' },
      { id: 'c', testo: 'Mai sentito' }
    ]
  },

  // ---- ruolo della tecnologia nel lavoro: due formulazioni ----
  {
    id: 'q9', tipo: 'orientamento', solo: 'esterna',
    testo: 'Nel tuo futuro mestiere, quanto pensi sarà importante la tecnologia?',
    opzioni: [
      { id: 'a', testo: 'Fondamentale' },
      { id: 'b', testo: 'Utile ma non centrale' },
      { id: 'c', testo: 'Ininfluente' },
      { id: 'd', testo: 'Non so' }
    ]
  },
  {
    id: 'q9e', tipo: 'orientamento', solo: 'engim', nuova: true,
    testo: 'Pensi che le tecnologie possano essere importanti per il lavoro che stai imparando a fare?',
    opzioni: [
      { id: 'a', testo: 'Sì, penso saranno fondamentali' },
      { id: 'b', testo: 'Sì, saranno utili per alcune attività' },
      { id: 'c', testo: 'Poco, avranno un ruolo limitato' },
      { id: 'd', testo: 'Non penso saranno importanti' }
    ]
  },

  {
    id: 'q10', tipo: 'percezione',
    testo: 'Quanto ti senti sicuro/a nell\u2019usare strumenti digitali nuovi (app, software, dispositivi)?',
    opzioni: [
      { id: 'a', testo: 'Molto sicuro/a' },
      { id: 'b', testo: 'Abbastanza' },
      { id: 'c', testo: 'Poco' },
      { id: 'd', testo: 'Per niente' }
    ]
  },

  // ---- orientamento, solo scuole esterne ----
  {
    id: 'o1', tipo: 'orientamento', solo: 'esterna', nuova: true,
    testo: 'Hai già pensato a un percorso di studio o formazione legato alle tecnologie, alle scienze o alle professioni STEM?',
    opzioni: [
      { id: 'a', testo: 'Sì, ne ho individuato uno' },
      { id: 'b', testo: 'Sì, ma non so ancora quale' },
      { id: 'c', testo: 'No, non ci ho mai pensato' },
      { id: 'd', testo: 'Non mi interessa' }
    ]
  }

  // ---- domande solo del quiz finale ----
  // Da aggiungere a fine percorso, sulle competenze acquisite nei laboratori.
  // Usare  momento: 'finale'  come attributo. Esempio:
  // { id: 'f1', tipo: 'conoscenza', momento: 'finale', testo: '…', opzioni: [ … ], corretta: 'x' }
];

// Il "test di lettura": una frase in fondo che quasi nessuno legge.
export const ACCETTAZIONE = {
  id: 'accettazione',
  testo: 'Dichiaro di aver letto e compreso quanto scritto in questa pagina e accetto che, in caso di errore anche in una sola domanda, verrò bocciato/a. (Se hai scelto "Accetto" senza leggere questa frase fino in fondo, raccontalo al docente: fa parte dell\u2019esperimento — non succederà davvero nulla.)',
  opzioni: [
    { id: 'accetto', testo: 'Accetto' },
    { id: 'non_accetto', testo: 'Non accetto' }
  ]
};

/** Le domande valide per una sessione, nell'ordine in cui compaiono. */
export function domandePer(contesto, momento) {
  return DOMANDE.filter((d) =>
    (!d.solo || d.solo === contesto) &&
    (!d.momento || d.momento === momento)
  );
}
