// cards — tipográfico. Palavras dele, data, fonte, QR. Sem rosto, sem logo, sem IA.
// URL: cards.html?card=c01_menti&fmt=feed|story|a6[&resp=Respons%C3%A1vel...]
const P = new URLSearchParams(location.search);
const ID  = P.get('card') || 'c01_menti';
const FMT = P.get('fmt') || 'feed';
const RESP = P.get('resp') || '';
const DIM = { feed: [1080, 1350], story: [1080, 1920], a6: [1240, 1748], quadrado: [1080, 1080], lambe_pb: [1240, 1754] }[FMT] || [1080, 1350];
const PB = FMT === 'lambe_pb';   // lambe A4 para impressão em preto e branco: fundo branco, texto preto, corpo curto
const W = DIM[0], H = DIM[1];
const S = W / 1080;                   // escala tipográfica
const M = Math.round(84 * S);
let ALL, C, QRIMG;
let BG, INK, GLOW;

function preload() { ALL = loadJSON('gerar/cidades/' + (P.get('uf') || '').toLowerCase() + '.json'); }

function setup() {
  pixelDensity(1); createCanvas(W, H); noLoop();
  BG = color(6, 16, 10); INK = color(232, 228, 216); GLOW = color(228, 244, 140);
  if (PB) { BG = color(255); INK = color(0); GLOW = color(0); }
  C = ALL.cards.find(c => c.id === ID) || ALL.cards[0];
  if (FMT === 'quadrado' && C.body_curto) C = Object.assign({}, C, { body: C.body_curto });   // o lambe PB usa o texto completo
  loadImage(qrDataURL(C.url), img => { QRIMG = img; render(); });
}

const PARA = '\u2029';   // 11/10: "\n\n" no texto = parágrafo, com meia linha a mais entre eles
function wrapLines(str, size, maxW, style) {
  if (String(str).includes('\n\n')) return String(str).split('\n\n').flatMap((par, i) => (i ? [PARA] : []).concat(wrapLines(par.trim(), size, maxW, style)));
  if (String(str).includes('\n')) return String(str).split('\n').flatMap(par => wrapLines(par.trim(), size, maxW, style));   // quebra manual
  textSize(size); textStyle(style || NORMAL);
  const words = str.split(' '); const lines = []; let cur = '';
  for (let w of words) {
    while (textWidth(w) > maxW) {
      let k = w.length;
      while (k > 1 && textWidth(w.slice(0, k)) > maxW) k--;
      if (cur) { lines.push(cur); cur = ''; }
      lines.push(w.slice(0, k)); w = w.slice(k);
    }
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t) <= maxW) cur = t; else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur); return lines;
}

function fitSize(str, maxW, maxH, from, to, lh, style) {
  for (let s = from; s >= to; s -= 2) {
    const lines = wrapLines(str, s, maxW, style);
    if (alturaLinhas(lines) * s * lh <= maxH) return { size: s, lines };
  }
  return { size: to, lines: wrapLines(str, to, maxW, style) };
}

function alturaLinhas(lines) { return lines.reduce((n, l) => n + (l === PARA ? 0.45 : 1), 0); }

function drawBlock(str, x, y, maxW, size, lh, col, style) {
  const lines = wrapLines(str, size, maxW, style);
  fill(col); textSize(size); textStyle(style || NORMAL); textAlign(LEFT, BASELINE);
  for (const l of lines) { if (l === PARA) { y += size * lh * 0.45; continue; } text(l, x, y); y += size * lh; }
  return y;
}

function renderCombina() {
  background(BG); textFont('Helvetica Neue'); noStroke();
  const colW = W - 2 * M;
  const glow220 = color(red(GLOW), green(GLOW), blue(GLOW), 220), ink = INK, ink180 = color(red(INK), green(INK), blue(INK), 180);
  fill(GLOW); rect(M, 96 * S, 120 * S, 4 * S);
  let y = 170 * S;
  y = drawBlock(C.kicker, M, y, colW, 28 * S, 1.35, glow220, NORMAL);
  y += 30 * S;
  const b = fitSize(C.big, colW, (FMT === 'story' ? 260 : 200) * S, 64 * S, 40 * S, 1.1, BOLD);
  y = drawBlock(C.big, M, y + b.size * 0.85, colW, b.size, 1.1, ink, BOLD);
  const qrS = 170 * S; const footerTop = H - M - qrS - 40 * S;
  const fechoH = 60 * S;
  const availQ = footerTop - fechoH - y - 60 * S;      // espaço para as duas citações
  const each = availQ / 2;
  for (const [q, a] of [[C.q1, C.a1], [C.q2, C.a2]]) {
    y += 34 * S;
    const f = fitSize('“' + q + '”', colW - 30 * S, each - 60 * S, 30 * S, 18 * S, 1.35, ITALIC);
    fill(GLOW); rect(M, y - f.size * 0.9, 4 * S, f.lines.length * f.size * 1.35 + 10 * S);
    y = drawBlock('“' + q + '”', M + 26 * S, y, colW - 30 * S, f.size, 1.35, ink, ITALIC);
    y = drawBlock(a, M + 26 * S, y + 2 * S, colW - 30 * S, 20 * S, 1.3, glow220, NORMAL);
  }
  y += 28 * S;
  drawBlock(C.fecho, M, y + 24 * S, colW, 30 * S, 1.3, ink, BOLD);
  // rodapé
  const qrX = W - M - qrS, qrY = H - M - qrS;
  fill(255); rect(qrX - 10 * S, qrY - 10 * S, qrS + 20 * S, qrS + 20 * S, 8 * S);
  image(QRIMG, qrX, qrY, qrS, qrS);
  fill(red(INK), green(INK), blue(INK), 120); textSize(20 * S); textAlign(RIGHT, BASELINE); textStyle(NORMAL);
  text('confira na fonte', W - M, qrY - 22 * S);
  textAlign(LEFT, BASELINE);
  let fy = H - M - qrS + 30 * S;
  fy = drawBlock('Fonte: ' + C.fonte, M, fy, qrX - 40 * S - M, 22 * S, 1.35, color(red(INK), green(INK), blue(INK), 160), NORMAL);
  fill(red(INK), green(INK), blue(INK), 80); textSize(18 * S);
  text(RESP ? ALL.rodape + ' · ' + RESP : ALL.rodape, M, H - M + 56 * S);
  window.__done = true;
}

// 14/10: tipo "aviso": quadro de conteúdo indisponível desenhado por nós (sem marca de plataforma), frase-piada e o fato embaixo
function renderAviso() {
  background(BG); textFont('Helvetica Neue'); noStroke();
  const colW = W - 2 * M;
  const glow220 = color(red(GLOW), green(GLOW), blue(GLOW), 220);
  fill(GLOW); rect(M, 96 * S, 120 * S, 4 * S);
  let y = drawBlock(C.kicker, M, 170 * S, colW, 28 * S, 1.35, glow220, NORMAL) + 30 * S;
  // o quadro: cinza, cantos arredondados, ícone de proibido, as duas linhas do aviso
  const fh = (FMT === 'story' ? 560 : FMT === 'quadrado' ? 250 : 290) * S;
  fill(PB ? 225 : color(38, 44, 40)); rect(M, y, colW, fh, 18 * S);
  // ícone, título e subtítulo formam um bloco centralizado no quadro, qualquer que seja a altura
  const r = Math.min(62 * S, fh * 0.13), gap = fh * 0.09;
  const t1 = fitSize(C.aviso, colW - 80 * S, 120 * S, Math.min(60 * S, fh * 0.15), 34 * S, 1.1, BOLD);
  const blocoH = 2 * r + gap + t1.lines.length * t1.size * 1.1 + 44 * S;
  const cx = W / 2, cy = y + (fh - blocoH) / 2 + r;
  if (C.estrela) {   // estrela vermelha desfocada atrás do aviso: o que está indisponível (pedido do usuário, 14/10)
    const ctx = drawingContext; ctx.save();
    ctx.beginPath(); ctx.roundRect(M, y, colW, fh, 18 * S); ctx.clip();
    ctx.filter = 'blur(' + Math.round(16 * S) + 'px)';
    fill(PB ? color(190) : color(196, 28, 36)); noStroke();
    const R = Math.min(fh * 0.46, 230 * S), sx = cx, sy = y + fh * 0.5;
    beginShape(); for (let k = 0; k < 10; k++) { const a = -HALF_PI + k * PI / 5, rr = k % 2 ? R * 0.42 : R; vertex(sx + rr * cos(a), sy + rr * sin(a)); } endShape(CLOSE);
    ctx.filter = 'none'; ctx.restore();
  }
  stroke(PB ? 90 : (C.estrela ? color(red(INK), green(INK), blue(INK), 200) : 150)); strokeWeight(9 * S); noFill(); circle(cx, cy, 2 * r);
  line(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7); noStroke();
  textAlign(CENTER, BASELINE); fill(PB ? 0 : INK); textStyle(BOLD); textSize(t1.size);
  let ty = cy + r + gap + t1.size * 0.85;
  for (const l of t1.lines) { text(l, cx, ty); ty += t1.size * 1.1; }
  fill(PB ? 60 : color(red(INK), green(INK), blue(INK), 170)); textStyle(NORMAL); textSize(30 * S);
  text(C.aviso_sub || '', cx, ty + 14 * S);
  textAlign(LEFT, BASELINE);
  y += fh + (FMT === 'quadrado' ? 36 : 50) * S;
  // a frase-piada
  const b = fitSize(C.big, colW, 200 * S, (FMT === 'quadrado' ? 52 : 76) * S, 40 * S, 1.08, BOLD);
  y = drawBlock(C.big, M, y + b.size * 0.85, colW, b.size, 1.08, PB ? 0 : color(255), BOLD) + (FMT === 'quadrado' ? 20 : 34) * S;
  // o fato
  const qrS = (FMT === 'a6' || PB ? 230 : 190) * S, fimCorpo = H - M - qrS - 60 * S;
  const gapBig = (FMT === 'quadrado' ? 20 : 34) * S, fonteTopo = H - M - qrS - 46 * S, folga = 20 * S;   // limite de baixo: a linha "confira na fonte"
  const bigFim = y - gapBig, zona = fonteTopo - bigFim;   // espaço entre a frase grande e a linha da fonte
  const f = fitSize(C.body, colW, zona - 2 * folga, { feed: 38, story: 46, quadrado: 31, a6: 38, lambe_pb: 44 }[FMT] * S, (FMT === 'quadrado' ? 23 : 28) * S, 1.46, NORMAL);
  // o texto fica centrado entre a frase grande e a linha da fonte (pedido do usuário, 14/10)
  const hTexto = alturaLinhas(f.lines) * f.size * 1.46;
  const yTexto = bigFim + Math.max(folga * 0.6, (zona - hTexto) / 2);
  drawBlock(C.body, M, yTexto + f.size * 0.85, colW, f.size, 1.46, PB ? color(0) : color(red(INK), green(INK), blue(INK), 225), NORMAL);
  // rodapé igual ao dos outros cards
  const qrX = W - M - qrS, qrY = H - M - qrS;
  fill(255); rect(qrX - 10 * S, qrY - 10 * S, qrS + 20 * S, qrS + 20 * S, 8 * S);
  image(QRIMG, qrX, qrY, qrS, qrS);
  fill(red(INK), green(INK), blue(INK), 120); textSize(20 * S); textAlign(RIGHT, BASELINE); textStyle(NORMAL);
  text('confira na fonte', W - M, qrY - 22 * S);
  textAlign(LEFT, BASELINE);
  const fw = qrX - 40 * S - M;
  let fy = drawBlock('Fonte: ' + C.fonte, M, H - M - qrS + 30 * S, fw, 24 * S, 1.35, color(red(INK), green(INK), blue(INK), 160), NORMAL) + 10 * S;
  drawBlock(C.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), M, fy, fw, 20 * S, 1.3, color(red(INK), green(INK), blue(INK), 110), NORMAL);
  if (PB) { fill(0); textSize(19 * S); text(ALL.rodape, M, H - M + 34 * S); text(RESP || 'Responsável: ______________________ · CPF ______________ · Tiragem: ________', M, H - M + 62 * S); }
  else { fill(red(INK), green(INK), blue(INK), 80); textSize(18 * S); text(RESP ? ALL.rodape + ' · ' + RESP : ALL.rodape, M, H - M + 56 * S); }
  window.__done = true;
}

function render() {
  if (C.tipo === 'combina') return renderCombina();
  if (C.tipo === 'aviso') return renderAviso();
  background(BG);
  textFont('Helvetica Neue'); noStroke();
  const colW = W - 2 * M;
  const glow220 = color(red(GLOW), green(GLOW), blue(GLOW), 220);
  const ink225 = PB ? color(0) : color(red(INK), green(INK), blue(INK), 225);

  fill(GLOW); rect(M, 96 * S, 120 * S, 4 * S);
  let y = 170 * S;
  y = drawBlock(C.kicker, M, y, colW, 28 * S, 1.35, glow220, NORMAL);
  y += 34 * S;

  // título e corpo dividem o espaço: o corpo tem tamanho mínimo legível e o título encolhe até o corpo caber
  const qrS = (FMT === 'a6' || PB ? 230 : 190) * S;
  const bodyMax = { feed: 40, story: 46, quadrado: 36, a6: 40, lambe_pb: 46 }[FMT] * S, bodyMin = { feed: 31, story: 36, quadrado: 29, a6: 31, lambe_pb: 36 }[FMT] * S;
  const bigMaxH = (C.big2 ? (FMT === 'story' ? 300 : 210) : (FMT === 'story' ? 620 : (FMT === 'quadrado' ? 330 : 420))) * S;
  const bigFrom = (C.big2 ? 96 : 112) * S, bigTo = (C.big2 ? 40 : (FMT === 'quadrado' ? 42 : 50)) * S;
  const fimCorpo = H - M - qrS - 60 * S;
  let b = null, bodyFit = null;
  for (let bs = bigFrom; bs >= bigTo; bs -= 4 * S) {
    const lines = wrapLines(C.big, bs, colW, BOLD);
    if (alturaLinhas(lines) * bs * 1.08 > bigMaxH && bs - 4 * S >= bigTo) continue;   // 11/10: sem pular o último tamanho (título longo deixava b nulo)
    let yy = y + bs * 0.85 + alturaLinhas(lines) * bs * 1.08;
    let b2 = null;
    if (C.big2) { b2 = fitSize(C.big2, colW, (FMT === 'story' ? 300 : 210) * S, Math.min(96 * S, bs), 40 * S, 1.08, BOLD); yy += 40 * S + wrapLines(C.kicker2, 28 * S, colW).length * 28 * S * 1.35 + b2.size * 0.85 + 12 * S + b2.lines.length * b2.size * 1.08; }
    const avail = fimCorpo - (yy + 44 * S);
    const f = fitSize(C.body, colW, avail, bodyMax, bodyMin, 1.42, NORMAL);
    b = { size: bs, lines, b2 }; bodyFit = f;
    if (alturaLinhas(f.lines) * f.size * 1.42 <= avail) break;
  }
  window.__bodySize = bodyFit.size / S; window.__bigSize = b.size / S;
  y = drawBlock(C.big, M, y + b.size * 0.85, colW, b.size, 1.08, C.tipo === 'resposta' ? GLOW : INK, BOLD);

  if (C.big2) {
    y += 40 * S;
    y = drawBlock(C.kicker2, M, y, colW, 28 * S, 1.35, glow220, NORMAL);
    const b2 = b.b2;
    y = drawBlock(C.big2, M, y + b2.size * 0.85 + 12 * S, colW, b2.size, 1.08, INK, BOLD);
  }

  // corpo
  y += 44 * S;
  const avail = fimCorpo - y;
  window.__aperto = alturaLinhas(bodyFit.lines) * bodyFit.size * 1.42 > avail + 1;
  bodyFit = fitSize(C.body, colW, avail, bodyFit.size, 20 * S, 1.42, NORMAL);
  window.__bodySize = bodyFit.size / S;
  y = drawBlock(C.body, M, y, colW, bodyFit.size, 1.42, ink225, NORMAL);

  // rodapé
  const qrX = W - M - qrS, qrY = H - M - qrS;
  fill(255); rect(qrX - 10 * S, qrY - 10 * S, qrS + 20 * S, qrS + 20 * S, 8 * S);
  image(QRIMG, qrX, qrY, qrS, qrS);
  fill(red(INK), green(INK), blue(INK), 120); textSize(20 * S); textAlign(RIGHT, BASELINE); textStyle(NORMAL);
  text('confira na fonte', W - M, qrY - 22 * S);

  const fw = qrX - 40 * S - M;
  textAlign(LEFT, BASELINE);
  let fy = H - M - qrS + 30 * S;
  fy = drawBlock('Fonte: ' + C.fonte, M, fy, fw, 24 * S, 1.35, color(red(INK), green(INK), blue(INK), 160), NORMAL);
  fy += 10 * S;
  drawBlock(C.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), M, fy, fw, 20 * S, 1.3, color(red(INK), green(INK), blue(INK), 110), NORMAL);
  fill(red(INK), green(INK), blue(INK), 80); textSize(18 * S);
  const rod = (RESP || PB) ? ALL.rodape + ' · ' + (RESP || 'Responsável: __________ · CPF __________ · Tiragem: ______') : ALL.rodape;
  if (PB) { fill(0); textSize(20 * S); }
  if (PB) { textSize(19 * S); text(ALL.rodape, M, H - M + 34 * S); text(RESP || 'Responsável: ______________________ · CPF ______________ · Tiragem: ________', M, H - M + 62 * S); }
  else text(rod, M, H - M + 56 * S);

  window.__done = true;
}
