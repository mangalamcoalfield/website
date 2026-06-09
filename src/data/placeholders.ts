/**
 * Curated PLACEHOLDER content used when Supabase has no published rows yet
 * (e.g. before the content track lands, or if the free-tier project is paused).
 * Everything here is public-domain / general-knowledge and obeys the brief's
 * publish-filter: no confidential DPR data, no site-specific gas readings, no
 * internal production figures. Replace by inserting real rows in Supabase.
 */
import type { Job, CsrProject, KnowledgeEntry, NciPoint } from '../lib/supabase';

export const placeholderJobs: Job[] = [
  {
    id: 'ph-1',
    title: 'Mining Engineer (Underground)',
    dept: 'Operations',
    location: 'Amlabad, Eastern Jharia, Jharkhand',
    type: 'Full-time',
    description:
      'Plan and supervise underground development and production in line with the Coal Mines Regulations 2017. Placeholder posting — real roles will be published from the content track.',
    status: 'published',
    posted_at: '2026-01-15',
  },
  {
    id: 'ph-2',
    title: 'Statutory Safety Officer',
    dept: 'Safety & Compliance',
    location: 'Amlabad, Eastern Jharia, Jharkhand',
    type: 'Full-time',
    description:
      'Maintain statutory registers, gas-monitoring discipline and DGMS compliance across working districts. Placeholder posting.',
    status: 'published',
    posted_at: '2026-01-10',
  },
  {
    id: 'ph-3',
    title: 'Electrical & Mechanical Foreman',
    dept: 'Engineering',
    location: 'Amlabad, Eastern Jharia, Jharkhand',
    type: 'Full-time',
    description:
      'Maintain DGMS-approved equipment and statutory testing schedules for underground machinery. Placeholder posting.',
    status: 'published',
    posted_at: '2026-01-05',
  },
];

export const placeholderCsr: CsrProject[] = [
  {
    id: 'ph-1',
    title: 'Community welfare around Amlabad',
    category: 'community',
    status: 'completed',
    description: 'Local engagement and welfare initiatives in the villages around the Amlabad block.',
    evidence_url: null,
    impact_numbers: null,
    date: '2025-12-01',
  },
  {
    id: 'ph-2',
    title: 'Skill & safety training',
    category: 'safety',
    status: 'completed',
    description: 'Investment in workforce training and safety awareness for own and contractor labour.',
    evidence_url: null,
    impact_numbers: null,
    date: '2025-11-01',
  },
  {
    id: 'ph-3',
    title: 'Green cover & reclamation',
    category: 'environment',
    status: 'planned',
    description: 'Plantation and land-care contributions in the mine vicinity (planned).',
    evidence_url: null,
    impact_numbers: null,
    date: null,
  },
  {
    id: 'ph-4',
    title: 'Water & environment management',
    category: 'environment',
    status: 'planned',
    description: 'Responsible water management and dust-control measures (planned).',
    evidence_url: null,
    impact_numbers: null,
    date: null,
  },
];

export const placeholderKnowledge: KnowledgeEntry[] = [
  {
    id: 'ph-1',
    title: 'Bord & pillar mining, explained',
    type: 'explainer',
    category: 'operations',
    slug: 'bord-and-pillar-mining',
    body: 'How underground coal is won and the ground kept stable. Placeholder explainer — canonical article to be authored from the content track.',
    source_url: null,
    source_date: null,
    file_url: null,
  },
  {
    id: 'ph-2',
    title: 'Mine gas & methane management',
    type: 'explainer',
    category: 'safety',
    slug: 'mine-gas-and-methane-management',
    body: 'Gassiness, ventilation, and degasification — why air is everything underground. Methane is taught here as science; site-specific readings are never published.',
    source_url: null,
    source_date: null,
    file_url: null,
  },
  {
    id: 'ph-3',
    title: 'Coal grades & the National Coal Index',
    type: 'explainer',
    category: 'markets',
    slug: 'coal-grades-and-the-national-coal-index',
    body: 'How Indian coal is graded and priced, and how the National Coal Index is published monthly by the Ministry of Coal.',
    source_url: 'https://coal.nic.in',
    source_date: null,
    file_url: null,
  },
  {
    id: 'ph-4',
    title: 'DGMS & the rules of the mine',
    type: 'reg_link',
    category: 'regulation',
    slug: 'dgms-and-the-rules-of-the-mine',
    body: 'The statutory framework that governs Indian coal mining — DGMS, the Mines Act 1952, and the Coal Mines Regulations 2017.',
    source_url: 'https://www.dgms.gov.in',
    source_date: null,
    file_url: null,
  },
];

/** Latest known public NCI point. Update monthly from coal.nic.in (PDF). */
export const placeholderNci: NciPoint[] = [
  {
    id: 'ph-1',
    month: '2026-04',
    value: 148.4,
    sub_index: 'Non-coking · all-India',
    source_url: 'https://coal.nic.in',
  },
  {
    id: 'ph-2',
    month: '2026-03',
    value: 147.1,
    sub_index: 'Non-coking · all-India',
    source_url: 'https://coal.nic.in',
  },
];
