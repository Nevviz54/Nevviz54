/*
 * construir.js - junta todos os arquivos do jogo num HTML só.
 *
 * Para rodar:  node construir.js
 *
 * Gera dois arquivos:
 *   reino-sombrio.html  -> página completa, é só dar dois cliques para jogar
 *   .artefato.html      -> mesma coisa, mas sem as tags <html>/<head>/<body>,
 *                          que é o formato usado para publicar o jogo no Claude
 *
 * O jogo "de verdade" continua sendo o index.html + style.css + js/*.js.
 * Estes dois arquivos são só cópias montadas automaticamente.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PASTA = __dirname;
const ORDEM = ['utils', 'audio', 'art', 'data', 'game'];
const TITULO = 'Reino Sombrio';

const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0, ' +
    'maximum-scale=1.0, user-scalable=no, viewport-fit=cover">';

const FONTES = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&display=swap" rel="stylesheet">'
].join('\n');

function ler(...partes) {
    return fs.readFileSync(path.join(PASTA, ...partes), 'utf8');
}

/** Pega só o conteúdo de dentro do <body>, sem as tags <script src=...>. */
function corpoDoHtml(html) {
    const abre = html.indexOf('<body>');
    const fecha = html.lastIndexOf('</body>');
    if (abre < 0 || fecha < 0) throw new Error('index.html sem <body>');
    return html.slice(abre + '<body>'.length, fecha)
        .replace(/[ \t]*<script src="[^"]*"[^>]*><\/script>\r?\n?/g, '')
        .trim();
}

const css = ler('style.css');
const corpo = corpoDoHtml(ler('index.html'));
const js = ORDEM
    .map(nome => '/* ======================= js/' + nome + '.js ======================= */\n' + ler('js', nome + '.js'))
    .join('\n\n');

// o navegador fecharia o <script> cedo demais se esse texto aparecesse no código
if (js.includes('</script')) throw new Error('o código JavaScript não pode conter </script>');

const miolo = [
    '<title>' + TITULO + '</title>',
    VIEWPORT,
    FONTES,
    '<style>\n' + css + '\n</style>',
    corpo,
    '<script>\n' + js + '\n</script>'
].join('\n');

const paginaCompleta = [
    '<!DOCTYPE html>',
    '<html lang="pt-br">',
    '<head>',
    '<meta charset="UTF-8">',
    miolo.slice(0, miolo.indexOf('<style>')).trim(),
    miolo.slice(miolo.indexOf('<style>'), miolo.indexOf('</style>') + '</style>'.length),
    '</head>',
    '<body>',
    corpo,
    '<script>\n' + js + '\n</script>',
    '</body>',
    '</html>',
    ''
].join('\n');

fs.writeFileSync(path.join(PASTA, 'reino-sombrio.html'), paginaCompleta);
fs.writeFileSync(path.join(PASTA, '.artefato.html'), miolo + '\n');

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('reino-sombrio.html gerado:', kb(paginaCompleta.length));
console.log('.artefato.html gerado:    ', kb(miolo.length));
