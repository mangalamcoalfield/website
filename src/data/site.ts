/** Site-wide constants and navigation. */
export const SITE = {
  name: 'Mangalam Coalfield',
  legalName: 'Mangalam Coalfield Private Limited',
  portalUrl: 'https://app.mangalamcoal.com',   // Operations Portal
  mailUrl: '/mail',                             // Employee Mail — branded gateway page → Hostinger webmail
  webmailUrl: 'https://mail.hostinger.com',     // the actual Hostinger webmail login
  hrEmail: 'hr@mangalamcoal.com',
  seniorEmail: 'prashalya@mangalamcoal.com',   // senior-management enquiries
  phone: '+91 92882 76733',
  phoneHref: '+919288276733',
  location: 'Amlabad Colliery, Amlabad (PO) · Eastern Jharia Area, District Bokaro, Jharkhand',
  regOffice: 'Room No. 310, 3rd Floor, 1 R.N. Mukherjee Road, Kolkata, West Bengal 700001',
  cin: 'U05101WB2024PTC267785',
  description:
    'Mangalam Coalfield Private Limited is reviving the historic Amlabad pits in the Eastern Jharia Area of District Bokaro, Jharkhand — producing coal and coal bed methane with safety, statutory compliance, and engineering rigour at the core of every shift.',
};

// The navigation lives in src/i18n/ui.ts, which is what Site.astro renders and
// is the only version that carries both languages. A second copy used to sit
// here; nothing imported it and it had drifted (no Regulations, no News), so
// editing it would have silently changed nothing.
