// Interface strings for the Regulation Desk search (src/components/RegSearch.astro),
// in English and Hindi. Only the interface is translated: the Acts, rules and
// circulars, their titles, and the values the search filters on stay in English,
// the language they are published in. `client` goes to the browser as JSON;
// "{n}"-style placeholders are filled in there, and [singular, plural] pairs are
// chosen by count (Hindi uses the same form for both).

type Pair = [string, string];
const same = (s: string): Pair => [s, s];

export const SEARCH_UI = {
  en: {
    title: 'Search Indian mining regulations & DGMS circulars',
    eyebrow: 'Regulation desk',
    h1: 'Search regulations & circulars',
    searchIn: 'Search in', search: 'Search', browse: 'Browse',
    everything: 'Everything', statutes: 'Acts, rules & regulations', circulars: 'DGMS circulars',
    placeholder: 'Words, a "phrase", a provision or a circular number — e.g. headgear · Regulation 78 · 02 of 2009',
    slash: '/ to search',
    f_instrument: 'Instrument', f_document: 'Document', f_department: 'Department', f_collection: 'Collection',
    f_topic: 'Topic (digest)', f_year: 'Year', f_sort: 'Sort',
    allInstruments: 'All instruments', allDocuments: 'All documents', allDepartments: 'All departments',
    allCollections: 'All collections', allTopics: 'All topics', allYears: 'All years',
    best: 'Best match', newest: 'Newest first', oldest: 'Oldest first',
    clear: 'Clear search & filters', more: 'Show more',
    byYear: 'Circulars by year', byDept: 'Circulars by department', byTopic: 'Circulars by topic',
    topicNote: 'The regulation-wise digest of circulars up to 2017, arranged by the subject of the regulation they explain.',
    draft: 'Draft', superseded: 'Superseded',
    client: {
      label: { instrument: 'Instrument', doc: 'Document', dept: 'Department', year: 'Year', collection: 'Collection', topic: 'Topic' },
      kind: { statutes: 'Acts, rules & regulations', circulars: 'DGMS circulars' },
      status: {} as Record<string, string>,
      unavailable: 'Search is unavailable right now. Please try again shortly.',
      searching: 'Searching…',
      numberMatch: 'Number match', provisionMatch: 'Provision match',
      draft: 'Draft', superseded: 'Superseded',
      dgmsCircular: 'DGMS circular', actsTag: 'Act / rules / regulations',
      circular: 'Circular', regulation: 'Regulation', document: 'Document',
      readFull: 'Read full text', fullText: 'Full text',
      moreProv: ['{n} more matching provision in this document →', '{n} more matching provisions in this document →'] as Pair,
      removeFilter: 'Remove filter',
      splitIn: '{n} in {k}',
      noun: {
        result: ['result', 'results'] as Pair, circular: ['circular', 'circulars'] as Pair,
        document: ['document', 'documents'] as Pair, matchingDocument: ['matching document', 'matching documents'] as Pair,
      },
      provByNum: ['{n} provision by number', '{n} provisions by number'] as Pair,
      circNumbered: ['{n} circular numbered {a} of {y}', '{n} circulars numbered {a} of {y}'] as Pair,
      gazByNum: ['{n} gazette notification by number', '{n} gazette notifications by number'] as Pair,
      total: '{n} {noun}{containing}',
      containing: ' containing “{q}”',
      nothing: 'Nothing{contains}{for}. Try fewer words, another scope, or remove a filter.',
      containsQ: ' contains “{q}”',
      forScope: ' for {s}',
    },
  },
  hi: {
    title: 'भारतीय खनन विनियम व डीजीएमएस परिपत्र खोजें',
    eyebrow: 'विनियम डेस्क',
    h1: 'विनियम और परिपत्र खोजें',
    searchIn: 'कहाँ खोजें', search: 'खोजें', browse: 'ब्राउज़ करें',
    everything: 'सब कुछ', statutes: 'अधिनियम, नियम व विनियम', circulars: 'डीजीएमएस परिपत्र',
    placeholder: 'अंग्रेज़ी शब्द, प्रावधान या परिपत्र संख्या — जैसे headgear · Regulation 78 · 02 of 2009',
    slash: '/ दबाकर खोजें',
    f_instrument: 'दस्तावेज़ का प्रकार', f_document: 'दस्तावेज़', f_department: 'विभाग', f_collection: 'संग्रह',
    f_topic: 'विषय (डाइजेस्ट)', f_year: 'वर्ष', f_sort: 'क्रम',
    allInstruments: 'सभी प्रकार', allDocuments: 'सभी दस्तावेज़', allDepartments: 'सभी विभाग',
    allCollections: 'सभी संग्रह', allTopics: 'सभी विषय', allYears: 'सभी वर्ष',
    best: 'सबसे प्रासंगिक', newest: 'नवीनतम पहले', oldest: 'पुराने पहले',
    clear: 'खोज व फ़िल्टर हटाएँ', more: 'और दिखाएँ',
    byYear: 'वर्ष अनुसार परिपत्र', byDept: 'विभाग अनुसार परिपत्र', byTopic: 'विषय अनुसार परिपत्र',
    topicNote: '2017 तक के परिपत्रों का विनियम-वार डाइजेस्ट, उस विनियम के विषय के अनुसार जिसकी वे व्याख्या करते हैं।',
    draft: 'मसौदा', superseded: 'अधिक्रमित',
    client: {
      label: { instrument: 'प्रकार', doc: 'दस्तावेज़', dept: 'विभाग', year: 'वर्ष', collection: 'संग्रह', topic: 'विषय' },
      kind: { statutes: 'अधिनियम, नियम व विनियम', circulars: 'डीजीएमएस परिपत्र' },
      // The full-text pages' status labels, as Pagefind returns them.
      status: { 'Superseded': 'अधिक्रमित', 'Draft — not in force': 'मसौदा — लागू नहीं' } as Record<string, string>,
      unavailable: 'खोज अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर प्रयास करें।',
      searching: 'खोज रहे हैं…',
      numberMatch: 'संख्या से मिलान', provisionMatch: 'प्रावधान मिलान',
      draft: 'मसौदा', superseded: 'अधिक्रमित',
      dgmsCircular: 'डीजीएमएस परिपत्र', actsTag: 'अधिनियम / नियम / विनियम',
      circular: 'परिपत्र', regulation: 'विनियम', document: 'दस्तावेज़',
      readFull: 'पूरा पाठ पढ़ें (अंग्रेज़ी)', fullText: 'पूरा पाठ (अंग्रेज़ी)',
      moreProv: same('इस दस्तावेज़ में {n} और मिलते प्रावधान →'),
      removeFilter: 'फ़िल्टर हटाएँ',
      splitIn: '{k} में {n}',
      noun: {
        result: same('परिणाम'), circular: same('परिपत्र'),
        document: same('दस्तावेज़'), matchingDocument: same('मिलते दस्तावेज़'),
      },
      provByNum: same('संख्या से {n} प्रावधान'),
      circNumbered: same('संख्या {a}/{y} वाले {n} परिपत्र'),
      gazByNum: same('संख्या से {n} राजपत्र अधिसूचना'),
      total: '{containing}{n} {noun}',
      containing: '“{q}” वाले ',
      nothing: '{contains}कुछ नहीं मिला{for}। कम शब्द, कोई दूसरा दायरा या कोई फ़िल्टर हटाकर देखें।',
      containsQ: '“{q}” के लिए ',
      forScope: ' ({s})',
    },
  },
} as const;

/** DGMS wings, for display only (the filter values stay English). */
export const DEPT_HI: Record<string, string> = {
  'Technical': 'तकनीकी', 'Legislative': 'विधायी', 'General': 'सामान्य', 'Approval': 'अनुमोदन',
  'Examination': 'परीक्षा', 'Electrical': 'विद्युत', 'Occupational Health': 'व्यावसायिक स्वास्थ्य',
  'Safety alerts': 'सुरक्षा चेतावनियाँ', 'Gazette notifications': 'राजपत्र अधिसूचनाएँ',
  'Safety conference recommendations': 'सुरक्षा सम्मेलन की सिफ़ारिशें', 'Rules & regulations': 'नियम व विनियम',
  'Reports & statistics': 'रिपोर्ट व आँकड़े', 'Not stated': 'उल्लेख नहीं',
};
export const DEPT_NOTE_HI: Record<string, string> = {
  'Technical': 'तकनीकी विंग, S&T, SOMA, MAMID, Sapicom सहित',
  'Legislative': 'कानून, नियम और उनकी व्याख्या',
  'General': 'प्रशासन, क्षेत्राधिकार, प्रक्रिया',
  'Approval': 'उपकरणों और सामग्री का अनुमोदन',
  'Examination': 'खनन परीक्षा बोर्ड',
  'Electrical': 'विद्युत निरीक्षणालय',
  'Occupational Health': 'चिकित्सा परीक्षण और स्वास्थ्य',
  'Safety alerts': 'दुर्घटनाओं के बाद की चेतावनियाँ',
  'Gazette notifications': 'G.S.R. / S.O. अधिसूचनाएँ',
  'Safety conference recommendations': 'खानों में सुरक्षा पर राष्ट्रीय सम्मेलन',
  'Rules & regulations': 'डीजीएमएस द्वारा प्रकाशित नियम, पूर्ण पाठ में',
  'Reports & statistics': 'खान सांख्यिकी, SANKET, स्टैंडर्ड नोट',
  'Not stated': 'पुराने परिपत्र जिनमें विंग का उल्लेख नहीं',
};
/** A full text's numbered units ("259 regulations"). */
export const UNIT_HI: Record<string, string> = { regulation: 'विनियम', rule: 'नियम', section: 'धाराएँ', para: 'पैरा' };
