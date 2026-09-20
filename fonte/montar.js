/*
 * montar.js — junta a casca, os dados, as fotos e as fontes no arquivo final.
 *
 * Uso:  node fonte/montar.js
 *
 * Entrada:  fonte/casca.html   (estrutura, CSS e motor, com tokens @@...@@)
 *           fonte/dados.js     (const DATA = 429 passeios / const SRC = 99 fontes)
 *           fonte/*.jpg, fonte/*.woff2
 * Saída:    viagem-europa-nov-2026.html  (arquivo único, offline)
 */
const fs = require('fs');
const path = require('path');

const here = __dirname;                    /* fonte/ */
const root = path.resolve(here, '..');     /* pasta da viagem */
const outFile = path.join(root, 'viagem-europa-nov-2026.html');

const read = f => fs.readFileSync(path.join(here, f), 'utf8');
const shell = read('casca.html');
const dados = read('dados.js');

/* ---- 1. extrai os blocos DATA e SRC de dados.js ---- */
const dStart = dados.indexOf('const DATA=[') + 'const DATA=['.length;
const dEnd = dados.indexOf('\n];', dStart);
const dataBody = dados.slice(dStart, dEnd);

const sStart = dados.indexOf('const SRC={') + 'const SRC={'.length;
const sEnd = dados.indexOf('\n};', sStart);
const srcBody = dados.slice(sStart, sEnd);

if (dStart < 12 || dEnd < 0) throw new Error('bloco DATA nao encontrado em dados.js');
if (sStart < 11 || sEnd < 0) throw new Error('bloco SRC nao encontrado em dados.js');

const nItens = (dataBody.match(/\{c:"/g) || []).length;
const nFontes = (srcBody.match(/^\s*\['(of|co|mi)',/gm) || []).length;
if (nItens !== 429) throw new Error('esperava 429 passeios, achei ' + nItens);
if (nFontes !== 99) throw new Error('esperava 99 fontes, achei ' + nFontes);

/* ---- 2. embute fotos e fontes ---- */
const b64 = f => fs.readFileSync(path.join(here, f)).toString('base64');

let out = shell;
const put = (token, valor) => {
  if (out.indexOf(token) < 0) throw new Error('token ausente na casca: ' + token);
  out = out.split(token).join(valor);     /* split/join: nao interpreta $ do conteudo */
};

put('@@FONT_ARCHIVO@@', 'data:font/woff2;base64,' + b64('archivo.woff2'));
put('@@FONT_NARROW@@', 'data:font/woff2;base64,' + b64('archivo-narrow.woff2'));
put('@@IMG_BERLIN@@', 'data:image/jpeg;base64,' + b64('berlin.jpg'));
put('@@IMG_PARIS@@', 'data:image/jpeg;base64,' + b64('paris.jpg'));
put('@@IMG_COLONIA@@', 'data:image/jpeg;base64,' + b64('colonia.jpg'));
put('@@DATA@@', dataBody);
put('@@SRC@@', srcBody);

const sobra = out.match(/@@[A-Z_]+@@/g);
if (sobra) throw new Error('tokens nao substituidos: ' + sobra.join(', '));

/* ---- 3. guardas ---- */
const contar = (re) => (out.match(re) || []).length;
if (contar(/const DATA=/g) !== 1) throw new Error('const DATA= duplicado');
if (contar(/const SRC=/g) !== 1) throw new Error('const SRC= duplicado');
if (contar(/data:image\/jpeg;base64/g) !== 3) throw new Error('fotos embutidas != 3');
if (contar(/data:font\/woff2;base64/g) !== 2) throw new Error('fontes embutidas != 2');

fs.writeFileSync(outFile, out);

console.log('ok: ' + nItens + ' passeios, ' + nFontes + ' fontes, '
  + Math.round(out.length / 1024) + ' KB -> viagem-europa-nov-2026.html');
