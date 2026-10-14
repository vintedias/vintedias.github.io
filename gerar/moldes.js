// Motor da fábrica de memes: desenha um molde conhecido (gerar/moldes.json) com as linhas do banco (gerar/memes_moldes.json) num canvas.
// Mesma lógica do pipeline/memes_tpl.py: fonte "thick" = Anton/Impact branca com contorno preto em caixa alta; "thin" = Arial negrito preta;
// estilo "mock" alterna maiúsculas e minúsculas. Faixa de fonte embaixo (regra 8) e enquadramento em feed (1080x1350) ou story (1080x1920).
// Uso: await desenhaMolde(canvas, moldeCfg, linhas, { fmt: 'original'|'feed'|'story', fonte: '...', faixa: true, base: 'gerar/' })
(function () {
  const W = 1080;
  const COR = { white: '#fff', black: '#000', khaki: '#f0e68c', yellow: '#fadc28' };
  const FONTE_THICK = '"Anton", Impact, "Arial Narrow Bold", sans-serif';
  const FONTE_THIN = '"Helvetica Neue", Arial, sans-serif';
  const imgs = {};
  function carregaImagem(src) {
    if (imgs[src]) return imgs[src];
    imgs[src] = new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
    return imgs[src];
  }
  function mock(s) { let i = 0, out = ''; for (const ch of s) { if (/[A-Za-zÀ-ÿ]/.test(ch)) { out += i % 2 ? ch.toUpperCase() : ch.toLowerCase(); i++; } else out += ch; } return out; }
  function quebra(ctx, txt, maxW) {
    const out = [];
    for (const par of String(txt).split('\n')) {
      let cur = '';
      for (const w of par.split(' ')) { const t = (cur + ' ' + w).trim(); if (ctx.measureText(t).width <= maxW) cur = t; else { if (cur) out.push(cur); cur = w; } }
      out.push(cur);
    }
    return out;
  }
  function caixa(ctx, txt, box, c) {
    const [x, y, w, h] = box; const thick = (c.font || 'thick') === 'thick';
    if (c.style === 'upper' || (thick && c.style !== 'mock')) txt = txt.toUpperCase();
    if (c.style === 'mock') txt = mock(txt);
    let size = Math.floor(h * 0.9), lines = [], lh = 0;
    for (; size > 10; size -= 2) {
      ctx.font = (thick ? '400 ' : '700 ') + size + 'px ' + (thick ? FONTE_THICK : FONTE_THIN);
      lines = quebra(ctx, txt, w - 8); lh = size * 1.05;
      if (lines.length * lh <= h && lines.every(l => ctx.measureText(l).width <= w - 8)) break;
    }
    // baseline alfabética: a Anton/Impact estoura o topo do em-box com 'top'; a primeira linha nunca sobe acima da caixa
    let yy = Math.max(y + 2, y + (h - lines.length * lh) / 2);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const l of lines) {
      const mt = ctx.measureText(l); const asc = mt.actualBoundingBoxAscent || size * 0.86;   // topo real do glifo, para não cortar
      const by = yy + Math.min(asc, lh - 2) + 2;
      if (thick) { ctx.lineWidth = Math.max(4, size / 6); ctx.strokeStyle = '#000'; ctx.strokeText(l, x + w / 2, by); }
      ctx.fillStyle = COR[c.color || 'white'] || c.color || '#fff'; ctx.fillText(l, x + w / 2, by);
      yy += lh;
    }
  }
  async function desenhaMolde(canvas, molde, linhas, opt) {
    opt = opt || {}; const base = opt.base || '';
    try { if (document.fonts && document.fonts.load) await document.fonts.load('400 40px "Anton"'); } catch (e) {}
    const im = await carregaImagem(base + molde.img);
    const fmt = opt.fmt || 'original';
    if (fmt === 'figurinha') return figurinha(canvas, molde, linhas, im, opt);
    const faixaH = opt.faixa === false ? 0 : 84;
    // feed e story têm tamanho fixo (4:5 e 9:16, como o Instagram corta); a imagem encolhe para caber, nunca estoura
    const outW = W, outH = fmt === 'feed' ? 1350 : fmt === 'story' ? 1920 : Math.round(im.height * W / im.width) + faixaH;
    const s = Math.min(W / im.width, (outH - faixaH) / im.height), iw = Math.round(im.width * s), ih = Math.round(im.height * s);
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, outW, outH);
    const top = Math.max(0, Math.round((outH - faixaH - ih) / 2)), left = Math.round((outW - iw) / 2);
    ctx.drawImage(im, left, top, iw, ih);
    ctx.save(); ctx.translate(left, top);
    molde.caixas.forEach((c, i) => { const t = linhas[i]; if (!t) return; caixa(ctx, t, [c.anchor_x * iw, c.anchor_y * ih, c.scale_x * iw, c.scale_y * ih], c); });
    ctx.restore();
    if (faixaH) {
      const fy = outH - faixaH; ctx.fillStyle = '#121214'; ctx.fillRect(0, fy, outW, faixaH);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = '400 20px ' + FONTE_THIN; ctx.fillStyle = '#c8c8cd';
      const ls = quebra(ctx, 'Fonte: ' + (opt.fonte || ''), outW - 48).slice(0, 2); let yy = fy + 12;
      for (const l of ls) { ctx.fillText(l, 24, yy); yy += 23; }
      ctx.font = '400 17px ' + FONTE_THIN; ctx.fillStyle = '#82828c';
      ctx.fillText('material de eleitor · sem IA · meme de molde conhecido · só para o feed', 24, fy + faixaH - 24);
    }
    return canvas;
  }
  // figurinha de WhatsApp: 512x512, o meme inteiro cabendo no quadrado, fundo transparente, assinatura miúda
  function figurinha(canvas, molde, linhas, im, opt) {
    canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 512, 512);
    const s = Math.min(512 / im.width, 492 / im.height), iw = Math.round(im.width * s), ih = Math.round(im.height * s), x0 = Math.round((512 - iw) / 2), y0 = Math.round((492 - ih) / 2);
    ctx.drawImage(im, x0, y0, iw, ih);
    ctx.save(); ctx.translate(x0, y0);
    molde.caixas.forEach((c, i) => { const t = linhas[i]; if (!t) return; caixa(ctx, t, [c.anchor_x * iw, c.anchor_y * ih, c.scale_x * iw, c.scale_y * ih], c); });
    ctx.restore();
    ctx.font = '400 13px ' + FONTE_THIN; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.strokeText('material de eleitor · sem IA', 256, 496); ctx.fillStyle = '#555'; ctx.fillText('material de eleitor · sem IA', 256, 496);
    return canvas;
  }
  window.desenhaMolde = desenhaMolde;
  window.carregaImagemMolde = carregaImagem;
})();
