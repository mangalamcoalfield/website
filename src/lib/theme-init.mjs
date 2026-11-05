// The script that puts the reader's chosen theme on <html> before first paint
// (Site.astro, inline in <head>). astro.config.mjs hashes this same string into the
// pages' Content-Security-Policy, so the two can't drift apart.
export const THEME_INIT = "try{if(localStorage.getItem('theme')==='light'){document.documentElement.dataset.theme='light';document.querySelector('meta[name=theme-color]').content='#f7f8f4'}}catch(e){}";
