// Bilingual UI strings. Hindi is a real second version of the core pages, not a
// machine translation of the whole site: the document-heavy sections (the
// regulations library, the Learn explainers, the press page) stay in English
// because their source material is English, and the nav links straight to them.
export type Lang = 'en' | 'hi';

/** Pages that exist in both languages. '' is the home page. */
export const TRANSLATED = ['', 'about', 'operations', 'safety', 'cares', 'careers', 'contact'] as const;

export const detectLang = (pathname: string): Lang =>
  pathname === '/hi' || pathname.startsWith('/hi/') ? 'hi' : 'en';

/**
 * Whether this page genuinely exists in the other language. The nav toggle can
 * fall back to the other language's home, but an hreflang tag must not: claiming
 * the Hindi equivalent of /news is the Hindi home page is simply false, and the
 * pairing is not reciprocal, so search engines discard it either way.
 */
export function hasAlt(pathname: string, lang: Lang): boolean {
  const slug = (lang === 'hi' ? pathname.replace(/^\/hi\/?/, '') : pathname.replace(/^\//, '')).replace(/\/$/, '');
  return (TRANSLATED as readonly string[]).includes(slug);
}

/** The same page in the other language, falling back to that language's home. */
export function altHref(pathname: string, lang: Lang): string {
  const slug = (lang === 'hi' ? pathname.replace(/^\/hi\/?/, '') : pathname.replace(/^\//, '')).replace(/\/$/, '');
  const has = (TRANSLATED as readonly string[]).includes(slug);
  if (lang === 'hi') return has ? (slug ? `/${slug}` : '/') : '/';
  return has ? (slug ? `/hi/${slug}` : '/hi') : '/hi';
}

export const NAV: Record<Lang, { href: string; label: string }[]> = {
  en: [
    { href: '/about', label: 'About' },
    { href: '/operations', label: 'Operations' },
    { href: '/safety', label: 'Safety' },
    { href: '/learn', label: 'Learn' },
    { href: '/regulations', label: 'Regulations' },
    { href: '/cares', label: 'Cares' },
    { href: '/news', label: 'News' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
  ],
  hi: [
    { href: '/hi/about', label: 'हमारे बारे में' },
    { href: '/hi/operations', label: 'संचालन' },
    { href: '/hi/safety', label: 'सुरक्षा' },
    { href: '/learn', label: 'जानकारी' },
    { href: '/regulations', label: 'विनियम' },
    { href: '/hi/cares', label: 'मंगलम केयर्स' },
    { href: '/news', label: 'समाचार' },
    { href: '/hi/careers', label: 'करियर' },
    { href: '/hi/contact', label: 'संपर्क' },
  ],
};

export const UI = {
  en: {
    toggle: 'हिन्दी',
    toggleAria: 'Switch to Hindi',
    portal: 'Operations Portal',
    mail: 'Employee Mail',
    englishOnlyNote: '',
  },
  hi: {
    toggle: 'English',
    toggleAria: 'Switch to English',
    portal: 'ऑपरेशंस पोर्टल',
    mail: 'कर्मचारी मेल',
    englishOnlyNote: 'विनियम पुस्तकालय, जानकारी लेख और समाचार अनुभाग अंग्रेज़ी में हैं, क्योंकि उनके मूल दस्तावेज़ अंग्रेज़ी में हैं।',
  },
} satisfies Record<Lang, Record<string, string>>;
