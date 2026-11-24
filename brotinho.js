// Brotinho — o mascote do Broto 🌱
// brotinho(humor, tamanho, animação) devolve um SVG pronto para colocar no HTML.
// Humores: feliz, comemorando, preocupado, piscando, surpreso, dormindo

const C = {
  line: '#2F7D4A',
  body: '#B4EBA6',
  belly: '#D6F7CC',
  leafA: '#4DB868',
  leafB: '#74D17F',
  vein: '#C9F2C2',
  eye: '#1C3A28',
  cheek: '#FF9DAE',
  mouth: '#1C3A28',
  tongue: '#FF7F95',
  sweat: '#8FD3FF',
  star: '#FFC83D',
};

function eyes(m) {
  const e = C.eye;
  switch (m) {
    case 'comemorando':
      return `<path d="M57 100 Q64 90 71 100" stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M89 100 Q96 90 103 100" stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'piscando':
      return `<path d="M57 99 Q64 93 71 99" stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <ellipse cx="96" cy="98" rx="6" ry="7.5" fill="${e}"/><circle cx="98.2" cy="95" r="2.2" fill="#fff"/>`;
    case 'dormindo':
      return `<path d="M57 99 Q64 104 71 99" stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M89 99 Q96 104 103 99" stroke="${e}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'surpreso':
      return `<ellipse cx="64" cy="97" rx="6.5" ry="8.5" fill="${e}"/><circle cx="66.4" cy="93.5" r="2.4" fill="#fff"/>
              <ellipse cx="96" cy="97" rx="6.5" ry="8.5" fill="${e}"/><circle cx="98.4" cy="93.5" r="2.4" fill="#fff"/>`;
    case 'preocupado':
      return `<ellipse cx="64" cy="99" rx="5.5" ry="7" fill="${e}"/><circle cx="66" cy="96.2" r="2" fill="#fff"/>
              <ellipse cx="96" cy="99" rx="5.5" ry="7" fill="${e}"/><circle cx="98" cy="96.2" r="2" fill="#fff"/>
              <path d="M55 88 L70 84" stroke="${e}" stroke-width="3.2" stroke-linecap="round"/>
              <path d="M105 88 L90 84" stroke="${e}" stroke-width="3.2" stroke-linecap="round"/>`;
    default:
      return `<ellipse cx="64" cy="98" rx="6" ry="7.5" fill="${e}"/><circle cx="66.2" cy="95" r="2.2" fill="#fff"/>
              <ellipse cx="96" cy="98" rx="6" ry="7.5" fill="${e}"/><circle cx="98.2" cy="95" r="2.2" fill="#fff"/>`;
  }
}

function mouth(m) {
  const k = C.mouth;
  switch (m) {
    case 'comemorando':
      return `<path d="M69 110 Q80 128 91 110 Z" fill="${k}"/><path d="M74.5 117.5 Q80 123 85.5 117.5 Q80 115 74.5 117.5Z" fill="${C.tongue}"/>`;
    case 'preocupado':
      return `<path d="M71 117 Q75.5 112.5 80 117 Q84.5 121.5 89 117" stroke="${k}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case 'surpreso':
      return `<ellipse cx="80" cy="116" rx="5" ry="6" fill="${k}"/>`;
    case 'dormindo':
      return `<path d="M75 115 Q80 118 85 115" stroke="${k}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'piscando':
      return `<path d="M71 111 Q80 121 89 111" stroke="${k}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M70 110 Q80 122 90 110" stroke="${k}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }
}

function arms(m) {
  const up = m === 'comemorando';
  const L = up ? 'M36 104 Q24 92 22 78' : 'M34 112 Q22 118 22 128';
  const R = up ? 'M124 104 Q136 92 138 78' : 'M126 112 Q138 118 138 128';
  return `<g class="bt-arms" stroke-linecap="round" fill="none">
    <path d="${L}" stroke="${C.line}" stroke-width="11"/><path d="${L}" stroke="${C.body}" stroke-width="6"/>
    <path d="${R}" stroke="${C.line}" stroke-width="11"/><path d="${R}" stroke="${C.body}" stroke-width="6"/>
  </g>`;
}

function extras(m) {
  if (m === 'comemorando') {
    const star = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2Z" fill="${C.star}"/>`;
    return `<g class="bt-sparkles">${star(18, 60, 1)}${star(144, 56, 1.2)}${star(140, 96, 0.7)}${star(16, 98, 0.6)}</g>`;
  }
  if (m === 'preocupado') {
    return `<path class="bt-sweat" d="M120 74 Q126 84 120 88 Q114 84 120 74Z" fill="${C.sweat}" stroke="#5BB7EA" stroke-width="1.5"/>`;
  }
  if (m === 'dormindo') {
    return `<g fill="${C.line}" font-family="Nunito, sans-serif" font-weight="900"><text x="118" y="70" font-size="16">z</text><text x="130" y="56" font-size="12">z</text></g>`;
  }
  return '';
}

export function brotinho(mood = 'feliz', size = 120, anim = 'sway', label = 'Brotinho, o mascote do Broto') {
  return `<svg class="brotinho bt-${mood} ${anim ? 'bt-anim-' + anim : ''}" width="${size}" height="${size}" viewBox="0 0 160 160" role="img" aria-label="${label}">
  <ellipse cx="80" cy="152" rx="36" ry="5.5" fill="rgba(20,60,35,.10)"/>
  <g class="bt-body">
    <g class="bt-leaves">
      <path d="M80 60 C80 50 80 44 80 36" stroke="${C.line}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M80 42 C64 22 38 24 30 38 C44 54 68 54 80 42Z" fill="${C.leafA}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M76 42 C64 36 50 36 40 38" stroke="${C.vein}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M80 36 C90 14 120 10 132 22 C122 44 94 48 80 36Z" fill="${C.leafB}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M85 34 C98 28 112 24 124 23" stroke="${C.vein}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </g>
    <ellipse cx="65" cy="147" rx="11" ry="6" fill="${C.leafB}" stroke="${C.line}" stroke-width="3"/>
    <ellipse cx="95" cy="147" rx="11" ry="6" fill="${C.leafB}" stroke="${C.line}" stroke-width="3"/>
    ${arms(mood)}
    <path d="M80 56 C114 56 131 82 130 108 C129 134 107 147 80 147 C53 147 31 134 30 108 C29 82 46 56 80 56Z" fill="${C.body}" stroke="${C.line}" stroke-width="3.5"/>
    <ellipse cx="80" cy="124" rx="31" ry="18" fill="${C.belly}" opacity=".75"/>
    <ellipse cx="57" cy="76" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-32 57 76)"/>
    <ellipse cx="53" cy="111" rx="8.5" ry="5" fill="${C.cheek}" opacity=".6"/>
    <ellipse cx="107" cy="111" rx="8.5" ry="5" fill="${C.cheek}" opacity=".6"/>
    ${eyes(mood)}
    ${mouth(mood)}
  </g>
  ${extras(mood)}
</svg>`;
}

// Escolhe o que o Brotinho fala na tela inicial, conforme o mês.
export function brotinhoSays(ctx) {
  const { hasTx, net, overBudget, pending, cegToReceive, goalDone, name } = ctx;
  if (!hasTx) return { mood: 'piscando', text: `Oi${name ? ', ' + name : ''}! Eu sou o Brotinho. Toque no <b>+</b> para plantar seu primeiro lançamento 🌱` };
  if (goalDone) return { mood: 'comemorando', text: `Você bateu a meta do cofre <b>${goalDone}</b>! Tô orgulhoso demais 🎉` };
  if (overBudget) return { mood: 'preocupado', text: `Eita, <b>${overBudget}</b> já passou do orçamento do mês. Vamos segurar um pouquinho?` };
  if (net < 0) return { mood: 'preocupado', text: 'As despesas passaram as receitas neste mês. Bora regar esse orçamento com carinho 💧' };
  if (cegToReceive) return { mood: 'piscando', text: `Tem <b>${cegToReceive}</b> para receber das CEGs. Não esquece de cobrar a galera 💸` };
  if (pending) return { mood: 'feliz', text: `Você tem <b>${pending}</b> ${pending === 1 ? 'lançamento pendente' : 'lançamentos pendentes'} neste mês.` };
  return { mood: 'comemorando', text: 'Seu mês está no verde! Seu dinheiro tá crescendo bonito 💚' };
}
