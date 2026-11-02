"""Personal contact details the regulations search must not republish.

Circulars, drafts and DGMS Standard Notes print officers' e-mail addresses and,
in the Standard Notes' Annexure-VI, a telephone directory of every officer with
personal mobile and residence numbers. The PDFs are public, but the search pages
make every name findable, so the pages carry none of it.

    scrub(text) -> text without e-mail addresses, the officers' telephone
                   directory, or mobile numbers.
"""
import re

# PDF text often breaks a line at the @ ("dir.sd@ dgms.gov.in", "jlcran721 @gmail.com").
EMAIL = re.compile(r'[\w.+-]+[ \t]?@[ \t]?[\w-]+(?:\.[\w-]+)+')
# Indian mobiles: with the +91 prefix, or after a "Mob./Mobile/Phone/Tel" label.
# A bare 10-digit run is not enough: statistics tables are full of them.
MOBILE = re.compile(r'(?<![\d+])\+\s?91[\s-]?\d{5}\s?\d{5}(?!\d)'
                    r'|\b((?:Mob(?:ile)?|Phone|Ph|Tel|Cell)\b\.?(?:\s*No\.?)?[\s:.-]{0,3})(?:0|91)?[6-9]\d{4}\s?\d{5}(?!\d)', re.I)
# The Standard Notes' telephone directory annexure (names, designations, office,
# residence and mobile numbers of every DGMS officer). It starts at its heading,
# "Telephone Directory of Directorate General of Mines Safety, (DGMS) containing
# names ..." (the contents page names it too, without "containing", and is kept),
# and runs to the next part of the note ("CIRCULARS (ENGLISH)" in 2018) or to the
# end of the text. The end is found from the layout, not from phone numbers, so a
# corpus whose numbers were already removed is still cleaned.
DIRECTORY = re.compile(r'Telephone Directory of (?:the )?Directorate General of Mines Safety,?\s*\(?DGMS\)?\s*,?\s*containing', re.I)
DIRECTORY_END = re.compile(r'CIRCULARS \(ENGLISH\)')
DIRECTORY_NOTE = '[Telephone directory of DGMS officers omitted here; see the PDF.]'


def _drop_directory(text):
    m = DIRECTORY.search(text)
    if not m:
        return text
    end = DIRECTORY_END.search(text, m.end())
    return text[:m.start()] + DIRECTORY_NOTE + ('\n' + text[end.start():] if end else '')


def scrub(text):
    text = _drop_directory(text)
    text = EMAIL.sub('', text)
    return MOBILE.sub(lambda m: m.group(1) or '', text)
