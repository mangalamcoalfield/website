/**
 * Vetted, PUBLIC-only corpus for the "Ask Mangalam" bot.
 *
 * Everything here is public-domain page copy or general Indian coal-mining
 * knowledge — the same publish-filter as the rest of the site. The bot answers
 * ONLY from this corpus plus published `knowledge_entries` (fetched at request
 * time). Never add private/employee/DPR/site-specific data here: the bot runs
 * on a free-tier model whose inputs may be used for training.
 */
export interface CorpusChunk {
  title: string;
  text: string;
  source: string; // a site path the answer can cite/link
}

export const STATIC_CORPUS: CorpusChunk[] = [
  {
    title: 'Who Mangalam Coalfield is',
    source: '/about',
    text: 'Mangalam Coalfield Private Limited is a mine developer and operator reviving the historic Amlabad pits in Eastern Jharia, Jharkhand. It runs two commercial lines: underground coal mining and coal bed methane (CBM). The company stands on a foundation of rich legacy, resilience and shared values, carrying forward the vision of its founder; a new generation now leads, committed to trust, integrity and excellence. Late Shree Gopal Agarwal is honoured as Chairman Emeritus.',
  },
  {
    title: 'Operations — the two business lines',
    source: '/operations',
    text: 'Through the Amlabad block in Eastern Jharia, Jharkhand, Mangalam runs two commercial lines. Coal mining: reviving the historic underground workings across all four Amlabad pits — Pit No. 1, 2, 3 and 4 — through revival, development and dewatering, positioned as powering India\'s industrial growth through responsible coal. Coal bed methane (CBM): commercially capturing the methane held inside the same coal seams as a cleaner energy stream, put to use rather than vented to the atmosphere. This is a new commercial vertical alongside coal.',
  },
  {
    title: 'The four Amlabad pits',
    source: '/operations',
    text: 'Mangalam is reviving all four Amlabad pits in Eastern Jharia, Jharkhand: Pit No. 1 (revival), Pit No. 2 (development), Pit No. 3 (development) and Pit No. 4 (dewatering). These are general revival and development stages. The company does not publish production schedules, reserves, mine-plan economics or site-specific gas readings.',
  },
  {
    title: 'Capabilities',
    source: '/operations',
    text: 'Mangalam\'s four core capabilities are: Mine Development (driving and supporting underground roadways and galleries that open up the coal seam); Underground Operations (shift-by-shift production, reconciliation and structured reporting across working districts); Electrical & Mechanical (maintaining DGMS-approved equipment and statutory testing); and Statutory Compliance (operating to the Coal Mines Regulations 2017 and the Mines Act 1952, with qualified officials in every position).',
  },
  {
    title: 'Safety & compliance',
    source: '/safety',
    text: 'Underground coal mining carries real risk, so Mangalam treats statutory safety as the condition for permission to operate, not an afterthought. The Directorate General of Mines Safety (DGMS) sets the framework. Mangalam maintains qualified statutory officials across all DGMS-mandated positions, maintained statutory registers and periodic equipment testing, gas monitoring and ventilation discipline with roof-support standards, and medical examinations and competency tracking for the workforce. Methane is discussed publicly only as science; site-specific gas readings are never published.',
  },
  {
    title: 'Mangalam Cares (CSR & environment)',
    source: '/cares',
    text: 'Beyond production, Mangalam invests in the people and environment around the mine through Mangalam Cares — community welfare, skill and safety training, and land care such as green cover, reclamation and responsible water and dust management. The company showcases its own contributions: completed work shown with evidence, and planned work clearly labelled.',
  },
  {
    title: 'Careers',
    source: '/careers',
    text: 'Mangalam hires for roles in Indian coal mining — mining engineers, statutory safety, and electrical and mechanical positions — based at the Amlabad block in Eastern Jharia, Jharkhand. Candidates apply through the careers page by submitting their details and a résumé. The bot cannot make hiring decisions, promise interviews, or commit to any role.',
  },
  {
    title: 'Knowledge hub — how coal mining works',
    source: '/learn',
    text: 'The knowledge hub is a plain-language reference on Indian coal mining: the engineering (e.g. bord & pillar mining), the regulation (DGMS, the Mines Act 1952, the Coal Mines Regulations 2017), the science (mine gas and ventilation), and markets (coal grades and the National Coal Index, published monthly by the Ministry of Coal). It is built to inform, not to sell.',
  },
  {
    title: 'Contact & employee portal',
    source: '/contact',
    text: 'General enquiries go through the contact form on the contact page. Careers questions and applications go through the careers page. Existing employees use the Employee Portal. The bot does not capture leads itself — please use the contact form so the team can follow up.',
  },
];
