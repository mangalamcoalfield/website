"""Gazette page furniture inside legal text.

Every printed page of a Gazette of India notification carries a running header,
in English ("THE GAZETTE OF INDIA : EXTRAORDINARY [PART II—SEC. 3(i)]") and in
Hindi, which legacy-font PDFs extract as Kruti Dev gibberish ("Hkkx II[k.M 3(i)º
Hkkjr dk jkti=k % vlk/kj.k"). Extracted text runs them into the provisions
("...ten cubic meters;\\nTHE GAZETTE OF INDIA : EXTRAORDINARY [PART II—SEC. 3(i)]
(zc) gassy seam..."). strip() removes them; the provisions' own words are untouched.
"""
import re

_EN = re.compile(
    r'THE\s+GAZETTE\s+OF\s+INDIA\s*:?\s*EXTRAORDINARY'
    r'(?:\s*\[\s*PART\s+[IV]+\s*[—–-]\s*SEC(?:TION)?\.?\s*\d\s*(?:\(\s*(?:i{1,3}|iv)\s*\))?\s*\])?')
# Kruti Dev rendering of "भाग II—खण्ड 3(i)] भारत का राजपत्र : असाधारण", either half,
# with the page number that follows it.
_KD = re.compile(
    r'¹?Hkkx\s*II\s*[µμ]?\s*\[?k\.M\s*\d\s*\(\s*i{1,3}\s*\)\s*º'
    r'|Hkkjr\s+dk\s+jkti=k\s*%\s*vlk/kj\.k(?:\s*\(\d{1,4}\))?')


def strip(text):
    t = _KD.sub(' ', _EN.sub(' ', text))
    t = re.sub(r'[ \t]{2,}', ' ', t)
    t = re.sub(r'[ \t]+\n|\n[ \t]+', '\n', t)
    return re.sub(r'\n{2,}', '\n', t).strip()
