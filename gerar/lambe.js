// lambe — cartaz por bairro. Cada luz são dez vizinhos que ainda podem votar no dia 25.
// URL: lambe.html?bairro=Tijuca&cidade=Rio%20de%20Janeiro&votos=27972&naovotaram=21329&seed=1&qr=qr/lambe_tijuca.png
const P = new URLSearchParams(location.search);
const BAIRRO = P.get('bairro') || 'seu bairro';
const CIDADE = P.get('cidade') || '';
const PREP   = P.get('prep') || 'Em';
const ESCOPO = P.get('escopo') || 'bairro';
const TAM    = P.get('tam') || 'a4_300';
const VOTOS  = parseInt(P.get('votos') || '0', 10);
const NAOV   = parseInt(P.get('naovotaram') || '0', 10);
const SEED   = parseInt(P.get('seed') || '1', 10);
const QRP    = P.get('qr') || '';
const RESP   = P.get('resp') || '';
const POR_LUZ = parseInt(P.get('por_luz') || '10', 10);
const FONTE  = P.get('fonte') || 'site';   // 'site' = números copiados de ondedapraconversar.com.br; 'tse' = votação por seção somada por local/bairro
const NLOC   = parseInt(P.get('locais') || '0', 10);
const PB     = P.get('pb') === '1';   // impressão em preto e branco: fundo branco, pontos e texto pretos
const W = TAM === 'a4' ? 1240 : 2480, H = TAM === 'a4' ? 1754 : 3508;
const S = W / 2480;
const M = 180 * S;
let flies = [], QRIMG = null;
let BG, INK, GLOW;

function setup() {
  pixelDensity(1); createCanvas(W, H); noLoop();
  BG = color(6, 16, 10); INK = color(232, 228, 216); GLOW = color(228, 244, 140);
  if (PB) { BG = color(255); INK = color(0); GLOW = color(0); }
  randomSeed(SEED); noiseSeed(SEED);
  const n = Math.ceil(NAOV / POR_LUZ);
  let tries = 0;
  while (flies.length < n && tries < n * 80) {
    tries++;
    const x = random(60 * S, W - 60 * S), y = random(60 * S, H - 60 * S);
    const m = noise(x * 0.0011 / S, y * 0.0011 / S);
    const band = smoothBand(y);
    if (m > 0.36 && random() < band) {
      flies.push({ x, y, ph: random(TWO_PI), s: (random() < 0.05 ? random(7, 11) : random(2.6, 6)) * S });
    }
  }
  if (QRP) loadImage(QRP, img => { QRIMG = img; render(); }, () => render());
  else render();
}

function smoothBand(y) {
  const top = constrain((y - 1250 * S) / (500 * S), 0, 1);       // ralo em cima (título)
  const bot = constrain((H - 700 * S - y) / (400 * S), 0, 1);    // ralo embaixo (rodapé)
  const v = min(top, bot);
  return 0.12 + 0.88 * v * v * (3 - 2 * v);
}

function fmt(n) { return Math.round(n).toLocaleString('pt-BR'); }

function wrap(str, size, maxW, style) {
  textSize(size); textStyle(style || NORMAL);
  const out = []; let cur = '';
  for (const w of str.split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t) <= maxW) cur = t; else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur); return out;
}

function block(str, x, y, maxW, size, lh, col, style) {
  const lines = wrap(str, size, maxW, style);
  fill(col); textSize(size); textStyle(style || NORMAL); textAlign(LEFT, BASELINE);
  for (const l of lines) { text(l, x, y); y += size * lh; }
  return y;
}

function render() {
  background(BG);
  // vagalumes
  if (!PB) blendMode(ADD);
  for (const f of flies) {
    const pulse = 0.55 + 0.45 * pow(max(0, sin(f.ph)), 2);
    if (PB) { noStroke(); fill(0, 150 + 90 * pulse); circle(f.x, f.y, f.s * 2.6); continue; }
    fill(red(GLOW), green(GLOW), blue(GLOW), 16 * pulse); circle(f.x, f.y, f.s * 7);
    fill(red(GLOW), green(GLOW), blue(GLOW), 55 * pulse); circle(f.x, f.y, f.s * 3);
    fill(255, 250, 210, 235 * pulse); circle(f.x, f.y, f.s);
  }
  blendMode(BLEND);
  noStroke(); textFont('Helvetica Neue');

  // topo
  fill(GLOW); rect(M, 230 * S, 260 * S, 10 * S);
  let y = 420 * S;
  y = block('SEGUNDO TURNO · 25 DE OUTUBRO · 8H ÀS 17H', M, y, W - 2 * M, 54 * S, 1.3, color(red(GLOW), green(GLOW), blue(GLOW), 230), NORMAL);
  y += 120 * S;
  const local = CIDADE ? `${BAIRRO}, ${CIDADE}` : BAIRRO;
  y = block(`${PREP} ${BAIRRO}, ${fmt(NAOV)} pessoas não votaram no primeiro turno.`, M, y, W - 2 * M, 150 * S, 1.08, INK, BOLD);
  y += 70 * S;
  y = block('Não votou? Pode votar no dia 25. Os turnos são independentes.', M, y, W - 2 * M, 84 * S, 1.25, color(red(INK), green(INK), blue(INK), 215), NORMAL);

  // rodapé
  const qrS = 520 * S;
  const qx = W - M - qrS, qy = H - M - qrS - 40 * S;
  if (QRIMG) { fill(255); rect(qx - 24 * S, qy - 24 * S, qrS + 48 * S, qrS + 48 * S, 18 * S); image(QRIMG, qx, qy, qrS, qrS); }
  const fw = qx - 100 * S - M;
  let fy = qy + 80 * S;
  const porLuzTxt = POR_LUZ === 10 ? 'dez' : POR_LUZ === 100 ? 'cem' : POR_LUZ === 1000 ? 'mil' : fmt(POR_LUZ);
  fy = block(`Cada luz são ${porLuzTxt} vizinhos que ainda podem votar. Onde você vota: aponte a câmera.`, M, fy, fw, 58 * S, 1.3, color(red(INK), green(INK), blue(INK), 220), BOLD);
  fy += 30 * S;
  // lambe de rua: só para quem não votou (o número de viráveis e o convite para conversar ficam na ficha do bairro, para coletivos)
  fy = block('Domingo, 25 de outubro, das 8h às 17h. Leve um documento com foto ou o e-Título.', M, fy, fw, 50 * S, 1.35, color(red(INK), green(INK), blue(INK), 215), NORMAL);
  fy += 60 * S;
  const fonteTxt = ESCOPO !== 'bairro' ? 'Números: resultados oficiais do 1º turno por município, TSE. '
    : FONTE === 'tse' ? `Números: votação por seção do 1º turno (TSE) somada pelos ${NLOC ? NLOC + ' ' : ''}locais de votação do bairro; conta quem vota no bairro. `
    : 'Números: boletins de urna do 1º turno (TSE), via Onde dá pra conversar. ';
  // texto revisado pelo usuário (7/10): sem a linha de responsável/CPF/tiragem no lambe de rua, que não nomeia candidato
  block(fonteTxt + 'Material criado a partir de fatos e dados públicos verificados, sem IA.', M, fy, fw, 34 * S, 1.35, color(red(INK), green(INK), blue(INK), 120), NORMAL);

  window.__done = true;
}
