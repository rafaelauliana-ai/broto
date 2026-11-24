// Broto — organização financeira 🌱
import * as D from './data.js';
import { brotinho, brotinhoSays } from './brotinho.js';
import { parseFile, parseText, guessCategory } from './importer.js';

/* =========================================================
   Utilitários
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const ymOf = (s) => (s || '').slice(0, 7);
const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const addMonthsDate = (iso, n) => {
  const d = fromISO(iso); const day = d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last)); return isoDate(t);
};
const lastDay = (ym) => { const [y, m] = ym.split('-').map(Number); return isoDate(new Date(y, m, 0)); };
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthLabel = (ym) => { const [y, m] = ym.split('-').map(Number); return `${MES[m - 1]} ${y}`; };
const dayLabel = (iso) => {
  const d = fromISO(iso);
  const t = today();
  const y = isoDate(new Date(Date.now() - 864e5));
  const base = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
  if (iso === t) return 'Hoje · ' + base;
  if (iso === y) return 'Ontem · ' + base;
  return base;
};
const shortDate = (iso) => fromISO(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(/\./g, '');
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = (c) => BRL.format((c || 0) / 100);
const money = (c, force = false) => (S.hide && !force ? 'R$ •••••' : brl(c));
const centsToInput = (c) => ((Math.abs(c || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputToCents = (s) => parseInt(String(s || '').replace(/\D/g, ''), 10) || 0;
const initials = (n) => (n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- ícones ---------- */
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01',
  piggy: 'M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8zM8.5 8V6.5a3.5 3.5 0 0 1 7 0V8M12 12v5M9.8 14.5h4.4',
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  menu: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 5v14M5 12h14',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  chevL: 'M15 18l-6-6 6-6', chevR: 'M9 18l6-6-6-6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  check: 'M20 6 9 17l-5-5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M19 12l-7 7-7-7',
  swap: 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  x: 'M18 6 6 18M6 6l12 12',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z',
  split: 'M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M12 22v-8',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* =========================================================
   Estado
   ========================================================= */
const S = {
  user: null,
  route: 'inicio',
  month: ymOf(today()),
  hide: ls('broto_hide') === '1',
  txFilter: 'todos',
  txSearch: '',
  txAccount: '',
  cegTab: 'abertas',
  catTab: 'expense',
  shell: false,
  canInstall: false,
  sheetRefresh: null,
  importRows: null,
  onboardShown: false,
};

/* =========================================================
   Regras de negócio
   ========================================================= */
const db = D.db;
const cat = (id) => db.categories.find((c) => c.id === id);
const acc = (id) => db.accounts.find((a) => a.id === id);
const isCard = (a) => a?.type === 'cartao';
const ACC_TYPES = { corrente: ['Conta corrente', '🏦'], poupanca: ['Poupança', '🐷'], carteira: ['Carteira', '👛'], investimento: ['Investimento', '📈'], cartao: ['Cartão de crédito', '💳'] };
const COLORS = ['#2E9E5B', '#43A047', '#26A69A', '#4FC3F7', '#3D8BD6', '#7986CB', '#9575CD', '#BA68C8', '#F06292', '#E57373', '#FF8A65', '#FFB74D', '#F6C343', '#8D6E63', '#90A4AE', '#2B2F44'];
const EMOJIS = ['🍔', '🛒', '🚌', '🏠', '💡', '📺', '💿', '🛍️', '💊', '🎉', '📚', '🌀', '💰', '💻', '🏷️', '💸', '✨', '🎁', '✈️', '🐶', '👕', '💄', '🎮', '☕', '🍕', '⛽', '🚗', '🏋️', '🎵', '📱', '🧾', '🏦', '🐷', '📈', '💳', '👛', '🌱', '💚', '⭐', '🎓'];

const accounts = () => db.accounts.filter((a) => !a.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const categories = (type) => db.categories.filter((c) => !type || c.type === type).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

function effect(t, accountId) {
  let v = 0;
  if (t.type === 'income' && t.accountId === accountId) v += t.amount;
  if (t.type === 'expense' && t.accountId === accountId) v -= t.amount;
  if (t.type === 'transfer') { if (t.accountId === accountId) v -= t.amount; if (t.toAccountId === accountId) v += t.amount; }
  return v;
}
function balance(a, until = null, withPending = false) {
  let b = a.initial || 0;
  for (const t of db.transactions) {
    if (!withPending && !t.paid) continue;
    if (until && t.date > until) continue;
    b += effect(t, a.id);
  }
  return b;
}
const totalBalance = (until = null, withPending = false) => accounts().filter((a) => !isCard(a)).reduce((s, a) => s + balance(a, until, withPending), 0);
const monthTx = (ym) => db.transactions.filter((t) => ymOf(t.date) === ym);
function monthSummary(ym) {
  let inc = 0, exp = 0, incPaid = 0, expPaid = 0, pending = 0;
  for (const t of monthTx(ym)) {
    if (t.type === 'income') { inc += t.amount; if (t.paid) incPaid += t.amount; }
    else if (t.type === 'expense') { exp += t.amount; if (t.paid) expPaid += t.amount; }
    if (!t.paid) pending++;
  }
  return { inc, exp, incPaid, expPaid, net: inc - exp, pending };
}
function spentByCategory(ym) {
  const m = new Map();
  for (const t of monthTx(ym)) if (t.type === 'expense') m.set(t.categoryId, (m.get(t.categoryId) || 0) + t.amount);
  return m;
}
const cegShare = (c) => (c.participants || []).reduce((s, p) => s + (p.share || 0), 0);
const cegReceived = (c) => (c.participants || []).filter((p) => p.paid).reduce((s, p) => s + (p.share || 0), 0);
const cegToReceive = () => db.cegs.filter((c) => c.status !== 'encerrada').reduce((s, c) => s + cegShare(c) - cegReceived(c), 0);

/* =========================================================
   Componentes
   ========================================================= */
function toast(msg, mood = 'feliz') {
  $('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${brotinho(mood, 30, '')}<span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}
D.setErrorHandler((m) => toast(esc(m), 'preocupado'));

function sheet(title, body, { onMount, refresh } = {}) {
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-grab"></div>
    <header class="sheet-h"><h3>${title}</h3><button class="icon-btn flat" data-close aria-label="Fechar">${ic('x')}</button></header>
    <div class="sheet-b">${body}</div></div>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('open'));
  const key = (e) => { if (e.key === 'Escape') close(); };
  const close = () => {
    w.classList.remove('open');
    document.removeEventListener('keydown', key);
    if (refresh && S.sheetRefresh === refresh) S.sheetRefresh = null;
    setTimeout(() => w.remove(), 280);
  };
  document.addEventListener('keydown', key);
  w.addEventListener('mousedown', (e) => { if (e.target === w) close(); });
  w.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  w.close = close;
  if (refresh) S.sheetRefresh = refresh;
  onMount?.(w, close);
  return w;
}
function confirmBox(msg, { ok = 'Confirmar', danger = false, mood = 'surpreso' } = {}) {
  return new Promise((res) => {
    let done = false;
    const w = sheet('Tem certeza?', `<div class="center-hero">${brotinho(mood, 90, '')}<p>${msg}</p></div>
      <div class="sheet-actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cOk">${ok}</button></div>`, {
      onMount: (el, close) => { $('#cOk', el).onclick = () => { done = true; res(true); close(); }; },
    });
    const obs = new MutationObserver(() => { if (!document.body.contains(w)) { obs.disconnect(); if (!done) res(false); } });
    obs.observe(document.body, { childList: true });
  });
}
const monthSwitch = () => `<div class="month"><button data-act="month" data-d="-1" aria-label="Mês anterior">${ic('chevL', 18)}</button><b>${monthLabel(S.month)}</b><button data-act="month" data-d="1" aria-label="Próximo mês">${ic('chevR', 18)}</button></div>`;
const eyeBtn = () => `<button class="icon-btn" data-act="hide" aria-label="${S.hide ? 'Mostrar valores' : 'Esconder valores'}">${ic(S.hide ? 'eyeoff' : 'eye')}</button>`;
const emptyState = (mood, title, text, btn = '') => `<div class="empty">${brotinho(mood, 96, 'sway')}<b>${title}</b><span>${text}</span>${btn}</div>`;
const catOptions = (type, sel) => categories(type).map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('');
const accOptions = (sel, filter = () => true) => accounts().filter(filter).map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.emoji || ACC_TYPES[a.type]?.[1] || '🏦'} ${esc(a.name)}</option>`).join('');
const swatches = (name, sel) => `<div class="swatches">${COLORS.map((c, i) => `<input type="radio" name="${name}" id="${name}${i}" value="${c}" ${c === sel ? 'checked' : ''}><label for="${name}${i}" style="--c:${c}" title="${c}"></label>`).join('')}</div>`;
const emojiPick = (name, sel) => `<div class="emojis">${EMOJIS.map((e, i) => `<input type="radio" name="${name}" id="${name}${i}" value="${e}" ${e === sel ? 'checked' : ''}><label for="${name}${i}">${e}</label>`).join('')}</div>`;

/* =========================================================
   Tela de login
   ========================================================= */
let authMode = 'in';
function renderAuth() {
  S.shell = false;
  document.getElementById('app').innerHTML = `
  <div class="auth">
    <div class="auth-hero">
      ${brotinho('piscando', 150, 'bounce')}
      <h1 class="brand">Broto<span>finanças</span></h1>
      <p>Seu dinheiro crescendo com calma, um brotinho de cada vez.</p>
      <ul class="auth-feats">
        <li><span>📅</span>Lançamentos por dia, com saldo e status pago/pendente</li>
        <li><span>💳</span>Contas e cartões, cada um com seu saldo</li>
        <li><span>🐷</span>Cofres para guardar dinheiro por objetivo</li>
        <li><span>💿</span>CEGs com controle de quem já pagou</li>
        <li><span>📲</span>Instala no celular como app</li>
      </ul>
    </div>
    <div class="auth-card">
      ${D.DEMO ? `<div class="demo-note">${ic('info', 18)}<span><b>Modo demonstração.</b> Os dados ficam só neste aparelho até o Firebase ser configurado.</span></div><div style="height:14px"></div>` : ''}
      <div class="seg" role="tablist">
        <button data-act="authTab" data-tab="in" class="${authMode === 'in' ? 'on' : ''}">Entrar</button>
        <button data-act="authTab" data-tab="up" class="${authMode === 'up' ? 'on' : ''}">Criar conta</button>
      </div>
      <form id="authForm" novalidate>
        <label class="fld" ${authMode === 'up' ? '' : 'hidden'} id="nameFld"><span>Seu nome</span><input name="name" autocomplete="given-name" placeholder="Como o Brotinho vai te chamar?"></label>
        <label class="fld"><span>E-mail</span><input name="email" type="email" autocomplete="email" placeholder="voce@email.com" required></label>
        <label class="fld"><span>Senha</span><div class="pw"><input name="pass" type="password" autocomplete="${authMode === 'up' ? 'new-password' : 'current-password'}" placeholder="Mínimo 6 caracteres" required><button type="button" class="eye" data-act="togglePw" aria-label="Mostrar senha">${ic('eye')}</button></div></label>
        <div class="auth-err" id="authErr" hidden></div>
        <button class="btn primary block" type="submit" id="authBtn">${authMode === 'up' ? 'Criar minha conta' : 'Entrar'}</button>
        ${authMode === 'in' ? `<div class="center"><button type="button" class="link" data-act="forgot">Esqueci minha senha</button></div>` : ''}
        <div class="or">ou</div>
        <button type="button" class="btn ghost block" data-act="google"><svg class="gmark" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar com Google</button>
      </form>
    </div>
  </div>`;
  $('#authForm').addEventListener('submit', submitAuth);
}
function authMsg(msg, ok = false) {
  const el = $('#authErr');
  if (!el) return;
  el.hidden = !msg;
  el.className = 'auth-err' + (ok ? ' auth-ok' : '');
  el.innerHTML = msg;
}
async function submitAuth(e) {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim(), email = f.email.value.trim(), pass = f.pass.value;
  if (authMode === 'up' && !name) return authMsg('Conta pra gente seu nome 🌱');
  if (!/^\S+@\S+\.\S+$/.test(email)) return authMsg('Digite um e-mail válido.');
  if (pass.length < 6) return authMsg('A senha precisa ter pelo menos 6 caracteres.');
  const btn = $('#authBtn');
  btn.disabled = true; btn.textContent = authMode === 'up' ? 'Criando sua conta…' : 'Entrando…';
  authMsg('');
  try {
    if (authMode === 'up') await D.signUp(name, email, pass);
    else await D.signIn(email, pass);
    location.hash = '#/inicio';
  } catch (err) {
    console.error(err);
    authMsg(D.authError(err));
    btn.disabled = false; btn.textContent = authMode === 'up' ? 'Criar minha conta' : 'Entrar';
  }
}

/* =========================================================
   Estrutura do app
   ========================================================= */
const NAV = [
  ['inicio', 'Início', 'home'],
  ['lancamentos', 'Lançamentos', 'list'],
  ['contas', 'Contas', 'wallet'],
  ['cofres', 'Cofres', 'piggy'],
  ['cegs', 'CEGs', 'box'],
  ['categorias', 'Categorias', 'tag'],
  ['importar', 'Importar extrato', 'upload'],
  ['mais', 'Ajustes', 'sliders'],
];
const userName = () => db.profile?.name || S.user?.name || '';
function renderShell() {
  S.shell = true;
  const b = (r, label, icon) => `<a href="#/${r}" class="${S.route === r ? 'on' : ''}" data-r="${r}">${ic(icon, 22)}<span>${label}</span></a>`;
  document.getElementById('app').innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand-row">${brotinho('feliz', 44, 'sway')}<span class="brand">Broto</span></div>
      <button class="btn primary new" data-act="newTx">${ic('plus')} Novo lançamento</button>
      ${NAV.map(([r, l, i]) => `<a class="nav ${S.route === r ? 'on' : ''}" href="#/${r}" data-r="${r}">${ic(i)}${l}</a>`).join('')}
      <div class="side-foot"><span class="avatar">${esc(initials(userName()))}</span><div>${esc(userName() || 'Você')}<small>${esc(S.user?.email || '')}</small></div><button class="icon-btn flat" data-act="logout" title="Sair">${ic('logout')}</button></div>
    </aside>
    <main class="main" id="view"></main>
    <nav class="bnav" aria-label="Navegação">
      ${b('inicio', 'Início', 'home')}${b('lancamentos', 'Extrato', 'list')}
      <button class="fab" data-act="newTx" aria-label="Novo lançamento">${ic('plus', 28)}</button>
      ${b('cegs', 'CEGs', 'box')}${b('mais', 'Mais', 'menu')}
    </nav>
  </div>`;
  renderView();
}
function setActiveNav() {
  const moreRoutes = ['mais', 'contas', 'cofres', 'categorias', 'importar'];
  $$('.side a.nav').forEach((a) => a.classList.toggle('on', a.dataset.r === S.route));
  $$('.bnav a').forEach((a) => a.classList.toggle('on', a.dataset.r === S.route || (a.dataset.r === 'mais' && moreRoutes.includes(S.route))));
}
const VIEWS = {};
function renderView() {
  if (!S.shell) return renderShell();
  const v = $('#view');
  if (!v) return;
  v.innerHTML = (VIEWS[S.route] || VIEWS.inicio)();
  setActiveNav();
  AFTER[S.route]?.();
}
const AFTER = {};

/* =========================================================
   Início
   ========================================================= */
VIEWS.inicio = () => {
  const sum = monthSummary(S.month);
  const bal = totalBalance();
  const forecast = totalBalance(lastDay(S.month), true);
  const spent = spentByCategory(S.month);
  const over = categories('expense').find((c) => c.budget > 0 && (spent.get(c.id) || 0) > c.budget);
  const doneEnv = db.envelopes.find((e) => e.goal > 0 && e.saved >= e.goal && !e.celebrated);
  const toRec = cegToReceive();
  const say = brotinhoSays({ hasTx: db.transactions.length > 0, net: sum.net, overBudget: over?.name && esc(over.name), pending: sum.pending, cegToReceive: toRec > 0 ? money(toRec) : '', goalDone: doneEnv && esc(doneEnv.name), name: esc(userName().split(' ')[0]) });
  const showInstall = !isStandalone() && (S.canInstall || isIOS) && ls('broto_install_dismiss') !== '1';
  return `
  <header class="top">
    <div><p class="hello">Oi, ${esc(userName().split(' ')[0] || 'tudo bem')}! 🌱</p><h1>Início</h1></div>
    <div class="top-act">${monthSwitch()}${eyeBtn()}</div>
  </header>
  ${showInstall ? `<div class="install-banner">${brotinho('feliz', 46, '')}<p><b>Instale o Broto no celular</b>Abre direto da tela inicial, igual app.</p><button class="btn primary sm" data-act="install">Instalar</button><button class="icon-btn flat" data-act="dismissInstall" aria-label="Dispensar">${ic('x', 18)}</button></div>` : ''}
  <section class="hero">
    <div>
      <span class="lbl">${ic('wallet', 16)} Saldo geral</span>
      <strong class="big">${money(bal)}</strong>
      <span class="sub">Previsto para o fim de ${MES[Number(S.month.slice(5)) - 1]}: ${money(forecast)}</span>
      <div class="hero-stats">
        <div class="hstat"><span class="dot">${ic('up', 16)}</span><div><span>Receitas</span><b>${money(sum.inc)}</b></div></div>
        <div class="hstat"><span class="dot">${ic('down', 16)}</span><div><span>Despesas</span><b>${money(sum.exp)}</b></div></div>
      </div>
    </div>
    <div class="hero-mascot">${brotinho(say.mood, 118, 'sway')}</div>
  </section>
  <div class="bubble"><p>${say.text}</p></div>
  <div class="quick">
    <button data-act="newTx" data-type="expense"><span class="qi exp">${ic('down')}</span>Despesa</button>
    <button data-act="newTx" data-type="income"><span class="qi inc">${ic('up')}</span>Receita</button>
    <button data-act="newTx" data-type="transfer"><span class="qi trf">${ic('swap')}</span>Transferir</button>
    <button data-act="go" data-r="importar"><span class="qi imp">${ic('upload')}</span>Importar</button>
  </div>
  <div class="grid">
    <section class="card">${donutCard(spent)}</section>
    <section class="card span2">${barsCard()}</section>
    <section class="card">${pendingCard()}</section>
    <section class="card">${budgetsCard(spent)}</section>
    <section class="card">${accountsMini()}</section>
    <section class="card">${envelopesMini()}</section>
    <section class="card span2">${cegsMini()}</section>
  </div>`;
};

function donutCard(spent) {
  const entries = [...spent.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return `<h2>Gastos por categoria</h2>${emptyState('dormindo', 'Nenhum gasto ainda', 'Quando você lançar despesas, elas aparecem aqui.')}`;
  const top = entries.slice(0, 5);
  const rest = entries.slice(5).reduce((s, [, v]) => s + v, 0);
  const segs = top.map(([id, v]) => ({ name: cat(id)?.name || 'Sem categoria', color: cat(id)?.color || '#90A4AE', emoji: cat(id)?.emoji || '🌀', v }));
  if (rest) segs.push({ name: 'Outras', color: '#B0BEC5', emoji: '…', v: rest });
  const r = 46, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = segs.map((s) => { const len = (s.v / total) * C; const el = `<circle r="${r}" cx="60" cy="60" fill="none" stroke="${s.color}" stroke-width="16" stroke-dasharray="${Math.max(len - 2, 0.1)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`; off += len; return el; }).join('');
  return `<h2>Gastos por categoria <a href="#/categorias">Orçamentos</a></h2>
  <div class="donut-wrap">
    <div class="donut"><svg width="130" height="130" viewBox="0 0 120 120"><circle r="${r}" cx="60" cy="60" fill="none" stroke="var(--bg-2)" stroke-width="16"/>${arcs}</svg><div class="c"><div><small>Total</small>${money(total)}</div></div></div>
    <div class="legend">${segs.map((s) => `<div><i style="background:${s.color}"></i><span>${s.emoji} ${esc(s.name)}</span><b>${Math.round((s.v / total) * 100)}%</b></div>`).join('')}</div>
  </div>`;
}
function barsCard() {
  const months = [...Array(6).keys()].map((i) => addMonths(S.month, i - 5));
  const data = months.map((m) => { const s = monthSummary(m); return { m, inc: s.inc, exp: s.exp }; });
  const max = Math.max(1, ...data.flatMap((d) => [d.inc, d.exp]));
  const W = 560, H = 170, base = 140, bw = 22, gap = W / 6;
  const bars = data.map((d, i) => {
    const x = i * gap + gap / 2;
    const hi = (d.inc / max) * 120, he = (d.exp / max) * 120;
    return `<rect x="${x - bw - 2}" y="${base - hi}" width="${bw}" height="${Math.max(hi, 2)}" rx="7" fill="var(--income)" opacity="${d.m === S.month ? 1 : .55}"/>
            <rect x="${x + 2}" y="${base - he}" width="${bw}" height="${Math.max(he, 2)}" rx="7" fill="var(--expense)" opacity="${d.m === S.month ? 1 : .55}"/>
            <text x="${x}" y="${base + 20}" text-anchor="middle">${MES[Number(d.m.slice(5)) - 1].slice(0, 3)}</text>`;
  }).join('');
  return `<h2>Últimos 6 meses</h2><div class="bars"><svg viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--line)" stroke-width="1.5"/>${bars}</svg></div>
  <div class="bars-legend"><span><i style="background:var(--income)"></i>Receitas</span><span><i style="background:var(--expense)"></i>Despesas</span></div>`;
}
function pendingCard() {
  const list = monthTx(S.month).filter((t) => !t.paid).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  return `<h2>A pagar e receber <a href="#/lancamentos" data-act="filterPend">Ver tudo</a></h2>${list.length ? `<div class="mini-list">${list.map((t) => txRow(t, true)).join('')}</div>` : emptyState('feliz', 'Tudo em dia!', 'Nenhuma pendência neste mês.')}`;
}
function budgetsCard(spent) {
  const list = categories('expense').filter((c) => c.budget > 0);
  if (!list.length) return `<h2>Orçamentos</h2>${emptyState('piscando', 'Sem orçamentos', 'Defina um limite por categoria para o Brotinho te avisar.', `<a class="btn soft sm" href="#/categorias">Criar orçamento</a>`)}`;
  return `<h2>Orçamentos do mês <a href="#/categorias">Editar</a></h2>${list.map((c) => {
    const s = spent.get(c.id) || 0; const p = s / c.budget;
    return `<div class="budget"><div class="bt"><span>${c.emoji} ${esc(c.name)}</span><small>${money(s)} de ${money(c.budget)}</small></div><div class="bar ${p > 1 ? 'over' : p > .8 ? 'warn' : ''}"><i style="width:${Math.min(p, 1) * 100}%"></i></div></div>`;
  }).join('')}`;
}
function accountsMini() {
  const list = accounts();
  return `<h2>Contas <a href="#/contas">Ver contas</a></h2><div class="mini-list">${list.map((a) => {
    const b = balance(a);
    return `<div class="mini" data-act="editAcc" data-id="${a.id}"><span class="tx-ic" style="--c:${a.color}">${a.emoji || ACC_TYPES[a.type]?.[1]}</span><div class="tx-main"><b>${esc(a.name)}</b><small>${ACC_TYPES[a.type]?.[0] || ''}</small></div><span class="amt ${b < 0 ? 'neg' : ''}">${isCard(a) ? money(Math.max(0, -b)) : money(b)}</span></div>`;
  }).join('')}</div>`;
}
function envelopesMini() {
  const list = db.envelopes.slice(0, 3);
  if (!list.length) return `<h2>Cofres</h2>${emptyState('piscando', 'Guarde para um sonho', 'Crie um cofre para juntar dinheiro por objetivo.', `<a class="btn soft sm" href="#/cofres">Criar cofre</a>`)}`;
  return `<h2>Cofres <a href="#/cofres">Ver todos</a></h2>${list.map((e) => {
    const p = e.goal ? e.saved / e.goal : 0;
    return `<div class="budget"><div class="bt"><span>${e.emoji} ${esc(e.name)}</span><small>${money(e.saved)}${e.goal ? ' de ' + money(e.goal) : ''}</small></div><div class="bar"><i style="width:${Math.min(p, 1) * 100}%;background:${e.color}"></i></div></div>`;
  }).join('')}`;
}
function cegsMini() {
  const open = db.cegs.filter((c) => c.status !== 'encerrada');
  if (!open.length) return `<h2>CEGs em aberto</h2>${emptyState('piscando', 'Nenhuma CEG aberta', 'Organize suas compras em grupo e saiba quem já pagou.', `<button class="btn soft sm" data-act="newCeg">Nova CEG</button>`)}`;
  return `<h2>CEGs em aberto <a href="#/cegs">Ver todas</a></h2><div class="mini-list">${open.slice(0, 4).map((c) => {
    const tot = cegShare(c), rec = cegReceived(c), n = (c.participants || []).length, np = (c.participants || []).filter((p) => p.paid).length;
    return `<div class="mini" data-act="openCeg" data-id="${c.id}"><span class="tx-ic" style="--c:#BA68C8">💿</span><div class="tx-main"><b>${esc(c.name)}</b><small>${np} de ${n} pagaram</small></div><span class="amt">${money(tot - rec)}<small class="muted" style="display:block;font-size:11px;text-align:right">a receber</small></span></div>`;
  }).join('')}</div>`;
}

/* =========================================================
   Lançamentos
   ========================================================= */
function txRow(t, compact = false) {
  const c = cat(t.categoryId);
  const a = acc(t.accountId);
  let emoji = c?.emoji || '🌀', color = c?.color || '#90A4AE', title = t.desc || c?.name || 'Lançamento', sub = `${esc(c?.name || 'Sem categoria')} · ${esc(a?.name || 'Conta')}`;
  if (t.type === 'transfer') { emoji = '🔁'; color = '#3D8BD6'; title = t.desc || 'Transferência'; sub = `${esc(a?.name || '?')} → ${esc(acc(t.toAccountId)?.name || '?')}`; }
  if (compact) sub = shortDate(t.date) + ' · ' + sub;
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';
  return `<div class="${compact ? 'mini' : 'tx'} ${t.paid ? '' : 'pending'}" data-act="editTx" data-id="${t.id}">
    <span class="tx-ic" style="--c:${color}">${emoji}</span>
    <div class="tx-main"><b>${esc(title)}</b><small>${sub}</small></div>
    <div class="tx-right"><span class="amt ${t.type}">${sign} ${money(t.amount)}</span>
    <button class="st ${t.paid ? 'paid' : 'pend'}" data-act="togglePaid" data-id="${t.id}" title="Alterar status">${ic(t.paid ? 'check' : 'clock', 12)}${t.paid ? (t.type === 'income' ? 'recebido' : 'pago') : 'pendente'}</button></div>
  </div>`;
}
VIEWS.lancamentos = () => {
  const sum = monthSummary(S.month);
  const f = S.txFilter;
  const chip = (k, l) => `<button class="chip ${f === k ? 'on' : ''}" data-act="txFilter" data-f="${k}">${l}</button>`;
  return `
  <header class="top"><h1>Lançamentos</h1><div class="top-act">${monthSwitch()}${eyeBtn()}</div></header>
  <div class="sumrow">
    <div class="sum inc"><span>Receitas</span><b>${money(sum.inc)}</b></div>
    <div class="sum exp"><span>Despesas</span><b>${money(sum.exp)}</b></div>
    <div class="sum"><span>Balanço</span><b class="${sum.net < 0 ? 'neg' : ''}">${money(sum.net)}</b></div>
  </div>
  <div class="toolbar">
    <label class="search">${ic('search', 18)}<input class="input" id="txSearch" placeholder="Buscar lançamento" value="${esc(S.txSearch)}" autocomplete="off"></label>
    <div class="chips">
      ${chip('todos', 'Todos')}${chip('expense', 'Despesas')}${chip('income', 'Receitas')}${chip('transfer', 'Transferências')}${chip('pendentes', 'Pendentes')}
      <select class="chip ${S.txAccount ? 'on' : ''}" id="txAccount"><option value="">Todas as contas</option>${accOptions(S.txAccount)}</select>
    </div>
  </div>
  <div id="txList"></div>`;
};
AFTER.lancamentos = () => {
  renderTxList();
  const s = $('#txSearch');
  s.addEventListener('input', () => { S.txSearch = s.value; renderTxList(); });
  $('#txAccount').addEventListener('change', (e) => { S.txAccount = e.target.value; renderView(); });
};
function renderTxList() {
  const box = $('#txList');
  if (!box) return;
  const q = norm(S.txSearch);
  let list = monthTx(S.month).filter((t) => {
    if (S.txFilter === 'pendentes' && t.paid) return false;
    if (['expense', 'income', 'transfer'].includes(S.txFilter) && t.type !== S.txFilter) return false;
    if (S.txAccount && t.accountId !== S.txAccount && t.toAccountId !== S.txAccount) return false;
    if (q && !norm(`${t.desc} ${cat(t.categoryId)?.name} ${acc(t.accountId)?.name} ${t.note || ''}`).includes(q)) return false;
    return true;
  });
  if (!list.length) {
    box.innerHTML = `<div class="card">${emptyState(db.transactions.length ? 'surpreso' : 'piscando', db.transactions.length ? 'Nada por aqui' : 'Vamos começar?', db.transactions.length ? 'Nenhum lançamento com esses filtros neste mês.' : 'Toque no + para adicionar sua primeira despesa ou receita.', `<button class="btn primary sm" data-act="newTx">${ic('plus', 16)} Novo lançamento</button>`)}</div>`;
    return;
  }
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const groups = new Map();
  for (const t of list) { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); }
  const t0 = today();
  const accFilter = S.txAccount ? acc(S.txAccount) : null;
  box.innerHTML = [...groups.entries()].map(([d, items]) => {
    const future = d > t0;
    const bal = accFilter ? balance(accFilter, d, future) : totalBalance(d, future);
    return `<section class="day"><div class="day-h"><b>${dayLabel(d)}</b><small>${future ? 'saldo previsto' : 'saldo do dia'} <em>${money(bal)}</em></small></div>
      <div class="day-list">${items.map((t) => txRow(t)).join('')}</div></section>`;
  }).join('');
}

function openTx({ id = null, type = 'expense', preset = {} } = {}) {
  const t = id ? db.transactions.find((x) => x.id === id) : null;
  if (id && !t) return;
  const v = t ? { ...t } : { type, amount: 0, date: today(), desc: '', categoryId: '', accountId: accounts().find((a) => !isCard(a))?.id || accounts()[0]?.id, toAccountId: '', paid: true, note: '', ...preset };
  if (!accounts().length) { toast('Crie uma conta primeiro', 'surpreso'); location.hash = '#/contas'; return; }
  let cur = v.type;
  const catGrid = (tp, sel) => categories(tp).map((c, i) => `<input type="radio" name="categoryId" id="ct${i}" value="${c.id}" ${c.id === sel ? 'checked' : ''}><label for="ct${i}"><span class="em" style="--c:${c.color}">${c.emoji}</span>${esc(c.name)}</label>`).join('') || '<span class="muted">Nenhuma categoria. Crie em Categorias.</span>';
  const paidLabel = (tp) => (tp === 'income' ? 'Já recebi' : tp === 'transfer' ? 'Já foi feita' : 'Já paguei');
  const body = `<form id="txForm" autocomplete="off">
    <div class="seg type">${[['expense', 'Despesa'], ['income', 'Receita'], ['transfer', 'Transferência']].map(([k, l]) => `<button type="button" data-type="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <label class="amount-fld ${cur}"><span>R$</span><input class="money" name="amount" inputmode="numeric" value="${centsToInput(v.amount)}" aria-label="Valor"></label>
    <label class="fld"><span>Descrição</span><input name="desc" value="${esc(v.desc)}" placeholder="Ex.: Mercado, Salário, iFood…" maxlength="80"></label>
    <div class="row2">
      <label class="fld"><span>Data</span><input type="date" name="date" value="${v.date}" required></label>
      <div class="fld"><span>Atalhos</span><div class="chips"><button type="button" class="chip" data-day="0">Hoje</button><button type="button" class="chip" data-day="-1">Ontem</button></div></div>
    </div>
    <div class="fld" id="catFld" ${cur === 'transfer' ? 'hidden' : ''}><span>Categoria</span><div class="catgrid" id="catGrid">${catGrid(cur === 'transfer' ? 'expense' : cur, v.categoryId)}</div></div>
    <div class="row2">
      <label class="fld"><span id="accLbl">${cur === 'transfer' ? 'Sai de' : cur === 'income' ? 'Entra em' : 'Conta ou cartão'}</span><select name="accountId">${accOptions(v.accountId)}</select></label>
      <label class="fld" id="toFld" ${cur === 'transfer' ? '' : 'hidden'}><span>Vai para</span><select name="toAccountId"><option value="">Escolha…</option>${accOptions(v.toAccountId)}</select></label>
    </div>
    <label class="switch"><span id="paidLbl">${paidLabel(cur)}</span><input type="checkbox" name="paid" ${v.paid ? 'checked' : ''}></label>
    ${t ? (t.groupId ? `<p class="muted" style="margin:-4px 0 12px;font-weight:700;font-size:13px">${ic('refresh', 14)} Faz parte de uma série (${t.installment || 'repetição'}).</p>` : '') : `
    <div class="row2">
      <label class="fld"><span>Repetir</span><select name="repeat"><option value="none">Não repetir</option><option value="inst">Parcelado</option><option value="fixed">Fixo todo mês</option></select></label>
      <label class="fld" id="timesFld" hidden><span id="timesLbl">Parcelas</span><input type="number" name="times" min="2" max="60" value="2"></label>
    </div>`}
    <label class="fld"><span>Observação</span><textarea name="note" rows="2" maxlength="300" placeholder="Opcional">${esc(v.note || '')}</textarea></label>
    <div class="sheet-actions">${t ? `<button type="button" class="btn danger" id="txDel">${ic('trash', 18)}</button>` : ''}<button class="btn primary" type="submit">${t ? 'Salvar alterações' : 'Adicionar'}</button></div>
  </form>`;
  sheet(t ? 'Editar lançamento' : 'Novo lançamento', body, {
    onMount: (w, close) => {
      const f = $('#txForm', w);
      const setType = (tp) => {
        cur = tp;
        $$('.seg.type button', w).forEach((b) => b.classList.toggle('on', b.dataset.type === tp));
        $('.amount-fld', w).className = 'amount-fld ' + tp;
        $('#catFld', w).hidden = tp === 'transfer';
        if (tp !== 'transfer') $('#catGrid', w).innerHTML = catGrid(tp, v.type === tp ? v.categoryId : '');
        $('#toFld', w).hidden = tp !== 'transfer';
        $('#accLbl', w).textContent = tp === 'transfer' ? 'Sai de' : tp === 'income' ? 'Entra em' : 'Conta ou cartão';
        $('#paidLbl', w).textContent = paidLabel(tp);
      };
      $$('.seg.type button', w).forEach((b) => (b.onclick = () => setType(b.dataset.type)));
      $$('[data-day]', w).forEach((b) => (b.onclick = () => { f.date.value = isoDate(new Date(Date.now() + Number(b.dataset.day) * 864e5)); }));
      if (f.repeat) f.repeat.onchange = () => { $('#timesFld', w).hidden = f.repeat.value === 'none'; $('#timesLbl', w).textContent = f.repeat.value === 'inst' ? 'Parcelas' : 'Quantos meses'; f.times.value = f.repeat.value === 'fixed' ? 12 : 2; };
      if (!t) setTimeout(() => f.amount.focus(), 320);
      $('#txDel', w)?.addEventListener('click', async () => {
        if (t.groupId) {
          sheet('Excluir lançamento', `<div class="center-hero">${brotinho('surpreso', 80, '')}<p>Esse lançamento faz parte de uma série.</p></div>
            <div class="stack"><button class="btn ghost block" id="d1">Excluir só este</button><button class="btn danger block" id="d2">Excluir este e os próximos</button></div>`, {
            onMount: (w2, c2) => {
              $('#d1', w2).onclick = () => { D.remove('transactions', t.id); c2(); close(); toast('Lançamento excluído'); };
              $('#d2', w2).onclick = () => { D.removeMany('transactions', db.transactions.filter((x) => x.groupId === t.groupId && x.date >= t.date).map((x) => x.id)); c2(); close(); toast('Série excluída'); };
            },
          });
          return;
        }
        if (await confirmBox('Excluir este lançamento?', { ok: 'Excluir', danger: true })) { D.remove('transactions', t.id); close(); toast('Lançamento excluído'); }
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = inputToCents(f.amount.value);
        if (!amount) return toast('Digite um valor', 'surpreso');
        const categoryId = cur === 'transfer' ? '' : (f.categoryId?.value || $('input[name=categoryId]:checked', w)?.value || '');
        if (cur !== 'transfer' && !categoryId) return toast('Escolha uma categoria', 'surpreso');
        if (cur === 'transfer' && (!f.toAccountId.value || f.toAccountId.value === f.accountId.value)) return toast('Escolha contas diferentes', 'surpreso');
        const data = {
          type: cur, amount, date: f.date.value || today(), desc: f.desc.value.trim() || (cur === 'transfer' ? 'Transferência' : cat(categoryId)?.name || ''),
          categoryId, accountId: f.accountId.value, toAccountId: cur === 'transfer' ? f.toAccountId.value : '', paid: f.paid.checked, note: f.note.value.trim(),
        };
        if (t) { D.update('transactions', t.id, data); toast('Lançamento atualizado'); close(); return; }
        const rep = f.repeat?.value || 'none';
        const n = Math.min(Math.max(parseInt(f.times?.value || '1', 10) || 1, 2), 60);
        if (rep === 'none') { D.add('transactions', data); }
        else {
          const groupId = 'g' + Date.now().toString(36);
          const items = [];
          for (let i = 0; i < n; i++) {
            let amt = amount;
            if (rep === 'inst') { const base = Math.floor(amount / n); amt = i === 0 ? amount - base * (n - 1) : base; }
            items.push({ ...data, amount: amt, date: addMonthsDate(data.date, i), paid: i === 0 ? data.paid : false, groupId, installment: rep === 'inst' ? `${i + 1}/${n}` : 'fixo', desc: rep === 'inst' ? `${data.desc} (${i + 1}/${n})` : data.desc });
          }
          D.addMany('transactions', items);
        }
        toast(cur === 'income' ? 'Receita adicionada 💚' : cur === 'expense' ? 'Despesa adicionada' : 'Transferência feita', cur === 'income' ? 'comemorando' : 'feliz');
        if (ymOf(data.date) !== S.month) S.month = ymOf(data.date);
        close();
        renderView();
      });
    },
  });
}

/* =========================================================
   Contas
   ========================================================= */
VIEWS.contas = () => {
  const list = accounts();
  const normal = list.filter((a) => !isCard(a));
  const cards = list.filter(isCard);
  const archived = db.accounts.filter((a) => a.archived);
  return `
  <header class="top"><h1>Contas</h1><div class="top-act">${eyeBtn()}<button class="btn primary sm" data-act="newAcc">${ic('plus', 16)} Nova</button></div></header>
  <section class="hero" style="grid-template-columns:1fr auto">
    <div><span class="lbl">${ic('wallet', 16)} Saldo em contas</span><strong class="big">${money(totalBalance())}</strong><span class="sub">Previsto com pendências do mês: ${money(totalBalance(lastDay(ymOf(today())), true))}</span></div>
    <div class="hero-mascot">${brotinho('feliz', 96, 'sway')}</div>
  </section>
  <div class="section-t">Contas</div>
  <div class="acc-grid">${normal.map(accCard).join('') || `<div class="card">${emptyState('piscando', 'Nenhuma conta', 'Adicione sua conta do banco ou carteira.')}</div>`}</div>
  <div class="section-t">Cartões de crédito <button class="link" data-act="newAcc" data-type="cartao">+ Cartão</button></div>
  <div class="acc-grid">${cards.map(accCard).join('') || `<div class="card">${emptyState('dormindo', 'Nenhum cartão', 'Cadastre seu cartão para acompanhar a fatura e o limite.')}</div>`}</div>
  ${archived.length ? `<div class="section-t">Arquivadas</div><div class="menu">${archived.map((a) => `<button data-act="editAcc" data-id="${a.id}"><span class="mi">${a.emoji || '🏦'}</span><span class="mt">${esc(a.name)}<small>Toque para reativar</small></span></button>`).join('')}</div>` : ''}`;
};
function accCard(a) {
  const b = balance(a);
  const fut = balance(a, lastDay(ymOf(today())), true);
  if (isCard(a)) {
    const fatura = Math.max(0, -b);
    const used = a.limit ? Math.min(fatura / a.limit, 1) : 0;
    return `<div class="acc credit" data-act="editAcc" data-id="${a.id}">
      <div class="acc-h"><span class="tx-ic">${a.emoji || '💳'}</span><div><b>${esc(a.name)}</b><small>${a.closingDay ? `Fecha dia ${a.closingDay}` : 'Cartão de crédito'}${a.dueDay ? ` · vence dia ${a.dueDay}` : ''}</small></div></div>
      <div class="acc-bal"><div><small style="text-align:left;display:block">Fatura atual</small><strong>${money(fatura)}</strong></div><small>${a.limit ? `Disponível<br><b style="color:#fff">${money(Math.max(0, a.limit - fatura))}</b>` : ''}</small></div>
      ${a.limit ? `<div class="bar ${used > .9 ? 'over' : used > .7 ? 'warn' : ''}"><i style="width:${used * 100}%"></i></div>` : ''}
      <div class="env-a"><button class="btn soft sm" data-act="payCard" data-id="${a.id}">Pagar fatura</button><button class="btn ghost sm" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.25)" data-act="seeAcc" data-id="${a.id}">Lançamentos</button></div>
    </div>`;
  }
  return `<div class="acc" style="--c:${a.color}" data-act="editAcc" data-id="${a.id}">
    <div class="acc-h"><span class="tx-ic">${a.emoji || ACC_TYPES[a.type]?.[1]}</span><div><b>${esc(a.name)}</b><small>${ACC_TYPES[a.type]?.[0] || ''}</small></div></div>
    <div class="acc-bal"><strong class="${b < 0 ? 'neg' : ''}">${money(b)}</strong><small>Previsto<br><b>${money(fut)}</b></small></div>
    <div class="env-a"><button class="btn soft sm" data-act="newTx" data-type="transfer" data-from="${a.id}">Transferir</button><button class="btn ghost sm" data-act="seeAcc" data-id="${a.id}">Lançamentos</button></div>
  </div>`;
}
function openAcc(id = null, type = 'corrente') {
  const a = id ? db.accounts.find((x) => x.id === id) : null;
  const v = a ? { ...a } : { name: '', type, initial: 0, color: COLORS[0], emoji: ACC_TYPES[type][1], limit: 0, closingDay: '', dueDay: '' };
  const used = a && db.transactions.some((t) => t.accountId === a.id || t.toAccountId === a.id);
  const body = `<form id="accForm" autocomplete="off">
    <label class="fld"><span>Nome</span><input name="name" value="${esc(v.name)}" placeholder="Ex.: Nubank, Inter, Carteira" required maxlength="40"></label>
    <label class="fld"><span>Tipo</span><select name="type">${Object.entries(ACC_TYPES).map(([k, [l, e]]) => `<option value="${k}" ${k === v.type ? 'selected' : ''}>${e} ${l}</option>`).join('')}</select></label>
    <label class="fld"><span id="iniLbl">${v.type === 'cartao' ? 'Fatura atual em aberto' : 'Saldo inicial'}</span><input class="money" name="initial" inputmode="numeric" value="${centsToInput(v.type === 'cartao' ? -v.initial : v.initial)}"></label>
    <label class="switch" id="negFld" ${v.type === 'cartao' ? 'hidden' : ''}><span>Saldo inicial negativo</span><input type="checkbox" name="neg" ${v.type !== 'cartao' && v.initial < 0 ? 'checked' : ''}></label>
    <div id="cardFlds" ${v.type === 'cartao' ? '' : 'hidden'}>
      <label class="fld"><span>Limite</span><input class="money" name="limit" inputmode="numeric" value="${centsToInput(v.limit)}"></label>
      <div class="row2"><label class="fld"><span>Fecha no dia</span><input type="number" name="closingDay" min="1" max="31" value="${v.closingDay || ''}"></label><label class="fld"><span>Vence no dia</span><input type="number" name="dueDay" min="1" max="31" value="${v.dueDay || ''}"></label></div>
    </div>
    <div class="fld"><span>Ícone</span>${emojiPick('emoji', v.emoji)}</div>
    <div class="fld"><span>Cor</span>${swatches('color', v.color)}</div>
    <div class="sheet-actions">${a ? `<button type="button" class="btn danger" id="accDel">${used ? (a.archived ? 'Reativar' : 'Arquivar') : ic('trash', 18)}</button>` : ''}<button class="btn primary">${a ? 'Salvar' : 'Criar conta'}</button></div>
  </form>`;
  sheet(a ? 'Editar conta' : type === 'cartao' ? 'Novo cartão' : 'Nova conta', body, {
    onMount: (w, close) => {
      const f = $('#accForm', w);
      f.type.onchange = () => { const c = f.type.value === 'cartao'; $('#cardFlds', w).hidden = !c; $('#negFld', w).hidden = c; $('#iniLbl', w).textContent = c ? 'Fatura atual em aberto' : 'Saldo inicial'; };
      $('#accDel', w)?.addEventListener('click', async () => {
        if (used) { D.update('accounts', a.id, { archived: !a.archived }); close(); toast(a.archived ? 'Conta reativada' : 'Conta arquivada'); return; }
        if (await confirmBox(`Excluir a conta <b>${esc(a.name)}</b>?`, { ok: 'Excluir', danger: true })) { D.remove('accounts', a.id); close(); toast('Conta excluída'); }
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = f.name.value.trim();
        if (!name) return toast('Dê um nome para a conta', 'surpreso');
        const tp = f.type.value;
        let initial = inputToCents(f.initial.value);
        if (tp === 'cartao') initial = -initial; else if (f.neg.checked) initial = -initial;
        const data = { name, type: tp, initial, color: $('input[name=color]:checked', w)?.value || COLORS[0], emoji: $('input[name=emoji]:checked', w)?.value || ACC_TYPES[tp][1], limit: tp === 'cartao' ? inputToCents(f.limit.value) : 0, closingDay: Number(f.closingDay.value) || '', dueDay: Number(f.dueDay.value) || '' };
        if (a) D.update('accounts', a.id, data); else D.add('accounts', { ...data, archived: false, order: db.accounts.length });
        toast(a ? 'Conta atualizada' : 'Conta criada 🌱');
        close();
      });
    },
  });
}

/* =========================================================
   Cofres
   ========================================================= */
VIEWS.cofres = () => {
  const total = db.envelopes.reduce((s, e) => s + (e.saved || 0), 0);
  const goal = db.envelopes.reduce((s, e) => s + (e.goal || 0), 0);
  return `
  <header class="top"><h1>Cofres</h1><div class="top-act">${eyeBtn()}<button class="btn primary sm" data-act="newEnv">${ic('plus', 16)} Novo cofre</button></div></header>
  <section class="hero" style="grid-template-columns:1fr auto">
    <div><span class="lbl">${ic('piggy', 16)} Total guardado</span><strong class="big">${money(total)}</strong><span class="sub">${goal ? `${Math.round((total / goal) * 100)}% das suas metas (${money(goal)})` : 'Separe dinheiro por objetivo, como num envelope.'}</span></div>
    <div class="hero-mascot">${brotinho(goal && total >= goal ? 'comemorando' : 'feliz', 96, 'sway')}</div>
  </section>
  <div class="env-grid">${db.envelopes.length ? db.envelopes.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(envCard).join('') : `<div class="card" style="grid-column:1/-1">${emptyState('piscando', 'Nenhum cofre ainda', 'Que tal um cofre para o próximo comeback, uma viagem ou a reserva de emergência?', `<button class="btn primary sm" data-act="newEnv">Criar meu primeiro cofre</button>`)}</div>`}</div>`;
};
function envCard(e) {
  const p = e.goal ? e.saved / e.goal : 0;
  const done = e.goal && e.saved >= e.goal;
  return `<div class="env ${done ? 'done' : ''}" style="--c:${e.color}">
    ${done ? `<span class="done-badge">${brotinho('comemorando', 54, '')}</span>` : ''}
    <div class="env-h" data-act="editEnv" data-id="${e.id}"><span class="tx-ic">${e.emoji}</span><div><b>${esc(e.name)}</b><small>${e.deadline ? 'Até ' + fromISO(e.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '') : 'Sem prazo'}</small></div></div>
    <div class="env-v"><strong>${money(e.saved)}</strong><span>${e.goal ? `${Math.round(p * 100)}% de ${money(e.goal)}` : 'sem meta'}</span></div>
    ${e.goal ? `<div class="bar"><i style="width:${Math.min(p, 1) * 100}%"></i></div>` : ''}
    <div class="env-a"><button class="btn soft sm" data-act="envMove" data-id="${e.id}" data-op="in">${ic('plus', 16)} Guardar</button><button class="btn ghost sm" data-act="envMove" data-id="${e.id}" data-op="out">Retirar</button></div>
  </div>`;
}
function openEnv(id = null) {
  const e = id ? db.envelopes.find((x) => x.id === id) : null;
  const v = e || { name: '', emoji: '🐷', color: COLORS[0], goal: 0, saved: 0, deadline: '' };
  sheet(e ? 'Editar cofre' : 'Novo cofre', `<form id="envForm" autocomplete="off">
    <label class="fld"><span>Nome</span><input name="name" value="${esc(v.name)}" placeholder="Ex.: Reserva, Viagem, Show do NCT" required maxlength="40"></label>
    <div class="row2"><label class="fld"><span>Meta</span><input class="money" name="goal" inputmode="numeric" value="${centsToInput(v.goal)}"></label><label class="fld"><span>Prazo (opcional)</span><input type="date" name="deadline" value="${v.deadline || ''}"></label></div>
    ${e ? '' : `<label class="fld"><span>Já tem algum valor guardado?</span><input class="money" name="saved" inputmode="numeric" value="0,00"></label>`}
    <div class="fld"><span>Ícone</span>${emojiPick('emoji', v.emoji)}</div>
    <div class="fld"><span>Cor</span>${swatches('color', v.color)}</div>
    <div class="sheet-actions">${e ? `<button type="button" class="btn danger" id="envDel">${ic('trash', 18)}</button>` : ''}<button class="btn primary">${e ? 'Salvar' : 'Criar cofre'}</button></div>
  </form>`, {
    onMount: (w, close) => {
      const f = $('#envForm', w);
      $('#envDel', w)?.addEventListener('click', async () => { if (await confirmBox(`Excluir o cofre <b>${esc(e.name)}</b>?`, { ok: 'Excluir', danger: true })) { D.remove('envelopes', e.id); close(); toast('Cofre excluído'); } });
      f.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = f.name.value.trim();
        if (!name) return toast('Dê um nome para o cofre', 'surpreso');
        const data = { name, goal: inputToCents(f.goal.value), deadline: f.deadline.value || '', emoji: $('input[name=emoji]:checked', w)?.value || '🐷', color: $('input[name=color]:checked', w)?.value || COLORS[0] };
        if (e) D.update('envelopes', e.id, data);
        else { const saved = inputToCents(f.saved.value); D.add('envelopes', { ...data, saved, history: saved ? [{ date: today(), amount: saved }] : [] }); }
        toast(e ? 'Cofre atualizado' : 'Cofre criado 🐷');
        close();
      });
    },
  });
}
function envMove(id, op) {
  const e = db.envelopes.find((x) => x.id === id);
  if (!e) return;
  const hist = (e.history || []).slice(-6).reverse();
  sheet(op === 'in' ? `Guardar em ${esc(e.name)}` : `Retirar de ${esc(e.name)}`, `<form id="mvForm">
    <div class="center-hero">${brotinho(op === 'in' ? 'feliz' : 'surpreso', 80, 'sway')}<p>Guardado agora: <b>${brl(e.saved)}</b></p></div>
    <label class="amount-fld ${op === 'in' ? 'income' : 'expense'}"><span>R$</span><input class="money" name="v" inputmode="numeric" value="0,00"></label>
    <label class="switch"><span>Registrar também como transferência entre contas</span><input type="checkbox" name="asTx"></label>
    <label class="fld" id="mvAcc" hidden><span>${op === 'in' ? 'Sai de' : 'Volta para'}</span><select name="acc">${accOptions('', (a) => !isCard(a))}</select></label>
    ${hist.length ? `<div class="fld"><span>Últimas movimentações</span><div class="people">${hist.map((h) => `<div class="person"><span class="nm">${shortDate(h.date)}</span><b class="amt ${h.amount > 0 ? 'income' : 'expense'}">${h.amount > 0 ? '+' : '−'} ${brl(Math.abs(h.amount))}</b></div>`).join('')}</div></div>` : ''}
    <div class="sheet-actions"><button class="btn primary">${op === 'in' ? 'Guardar' : 'Retirar'}</button></div>
  </form>`, {
    onMount: (w, close) => {
      const f = $('#mvForm', w);
      setTimeout(() => f.v.focus(), 320);
      f.asTx.onchange = () => ($('#mvAcc', w).hidden = !f.asTx.checked);
      f.addEventListener('submit', (ev) => {
        ev.preventDefault();
        let v = inputToCents(f.v.value);
        if (!v) return toast('Digite um valor', 'surpreso');
        if (op === 'out') v = -Math.min(v, e.saved || 0);
        if (!v) return toast('Esse cofre está vazio', 'surpreso');
        const saved = (e.saved || 0) + v;
        D.update('envelopes', e.id, { saved, history: [...(e.history || []), { date: today(), amount: v }].slice(-50), celebrated: e.goal && saved >= e.goal ? false : e.celebrated || false });
        if (f.asTx.checked && f.acc.value) {
          D.add('transactions', { type: op === 'in' ? 'expense' : 'income', amount: Math.abs(v), date: today(), desc: `${op === 'in' ? 'Guardado no cofre' : 'Retirado do cofre'} ${e.name}`, categoryId: (op === 'in' ? categories('expense').find((c) => /outr/i.test(c.name)) : categories('income').find((c) => /outr/i.test(c.name)))?.id || '', accountId: f.acc.value, toAccountId: '', paid: true, note: 'cofre' });
        }
        close();
        if (op === 'in' && e.goal && saved >= e.goal && (e.saved || 0) < e.goal) celebrate(e);
        else toast(op === 'in' ? 'Guardado! Seu broto cresceu 🌱' : 'Valor retirado', op === 'in' ? 'comemorando' : 'feliz');
      });
    },
  });
}
function celebrate(e) {
  sheet('Meta batida!', `<div class="center-hero">${brotinho('comemorando', 150, 'bounce')}<h2 style="font-size:22px">Você conseguiu! 🎉</h2><p>O cofre <b>${esc(e.name)}</b> chegou em ${brl(e.goal)}. O Brotinho tá muito orgulhoso de você.</p></div><button class="btn primary block" data-close>Obrigada, Brotinho!</button>`);
  D.update('envelopes', e.id, { celebrated: true });
}

/* =========================================================
   CEGs (compras em grupo)
   ========================================================= */
VIEWS.cegs = () => {
  const toRec = cegToReceive();
  const open = db.cegs.filter((c) => c.status !== 'encerrada');
  const list = db.cegs.filter((c) => (S.cegTab === 'abertas' ? c.status !== 'encerrada' : c.status === 'encerrada')).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const cost = open.reduce((s, c) => s + (c.cost || 0), 0);
  return `
  <header class="top"><h1>CEGs</h1><div class="top-act">${eyeBtn()}<button class="btn primary sm" data-act="newCeg">${ic('plus', 16)} Nova CEG</button></div></header>
  <section class="hero" style="grid-template-columns:1fr auto;background:radial-gradient(400px 220px at 100% 0%, rgba(240,180,255,.45), transparent 60%),linear-gradient(140deg,#8E4FBF,#5B2E86)">
    <div><span class="lbl">${ic('box', 16)} A receber da galera</span><strong class="big">${money(toRec)}</strong><span class="sub">${open.length} ${open.length === 1 ? 'CEG aberta' : 'CEGs abertas'} · você investiu ${money(cost)}</span></div>
    <div class="hero-mascot">${brotinho(toRec > 0 ? 'piscando' : 'feliz', 96, 'sway')}</div>
  </section>
  <div class="seg" style="margin-bottom:14px;max-width:360px"><button data-act="cegTab" data-t="abertas" class="${S.cegTab === 'abertas' ? 'on' : ''}">Abertas</button><button data-act="cegTab" data-t="encerradas" class="${S.cegTab === 'encerradas' ? 'on' : ''}">Encerradas</button></div>
  <div class="env-grid">${list.length ? list.map(cegCard).join('') : `<div class="card" style="grid-column:1/-1">${emptyState('piscando', S.cegTab === 'abertas' ? 'Nenhuma CEG aberta' : 'Nenhuma CEG encerrada', 'Crie uma CEG, adicione quem participa e marque quem já pagou.', S.cegTab === 'abertas' ? `<button class="btn primary sm" data-act="newCeg">Criar CEG</button>` : '')}</div>`}</div>`;
};
function cegCard(c) {
  const ps = c.participants || [];
  const tot = cegShare(c), rec = cegReceived(c), np = ps.filter((p) => p.paid).length;
  return `<div class="ceg" data-act="openCeg" data-id="${c.id}">
    <div class="ceg-h"><span class="tx-ic">💿</span><div style="flex:1;min-width:0"><b>${esc(c.name)}</b><small>${esc(c.item || '')}${c.item && c.date ? ' · ' : ''}${c.date ? shortDate(c.date) : ''}</small></div>
    <span class="tag ${c.status === 'encerrada' ? 'closed' : np < ps.length ? 'warn' : ''}">${c.status === 'encerrada' ? 'Encerrada' : np < ps.length ? 'Cobrar' : ps.length ? 'Tudo pago' : 'Aberta'}</span></div>
    <div class="bar"><i style="width:${tot ? (rec / tot) * 100 : 0}%;background:#AB47BC"></i></div>
    <div class="ceg-f"><span>${np} de ${ps.length} pagaram</span><span>Recebido <b>${money(rec)}</b> de ${money(tot)}</span></div>
  </div>`;
}
function openCegForm(id = null) {
  const c = id ? db.cegs.find((x) => x.id === id) : null;
  const v = c || { name: '', item: '', date: today(), cost: 0, note: '' };
  sheet(c ? 'Editar CEG' : 'Nova CEG', `<form id="cegForm" autocomplete="off">
    <label class="fld"><span>Nome da CEG</span><input name="name" value="${esc(v.name)}" placeholder="Ex.: CEG NCT 127 — álbum" required maxlength="60"></label>
    <label class="fld"><span>O que está sendo comprado</span><input name="item" value="${esc(v.item)}" placeholder="Ex.: 10 álbuns + POB" maxlength="80"></label>
    <div class="row2"><label class="fld"><span>Data</span><input type="date" name="date" value="${v.date || today()}"></label><label class="fld"><span>Quanto você pagou</span><input class="money" name="cost" inputmode="numeric" value="${centsToInput(v.cost)}"></label></div>
    <label class="fld"><span>Observação</span><textarea name="note" rows="2" maxlength="300" placeholder="Frete, taxa, link do pedido…">${esc(v.note || '')}</textarea></label>
    ${c ? '' : `<label class="switch"><span>Lançar o valor que paguei como despesa (categoria CEGs)</span><input type="checkbox" name="asTx" checked></label>
    <label class="fld" id="cegAcc"><span>Pago com</span><select name="acc">${accOptions(accounts()[0]?.id)}</select></label>`}
    <div class="sheet-actions"><button class="btn primary">${c ? 'Salvar' : 'Criar CEG'}</button></div>
  </form>`, {
    onMount: (w, close) => {
      const f = $('#cegForm', w);
      if (f.asTx) f.asTx.onchange = () => ($('#cegAcc', w).hidden = !f.asTx.checked);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = f.name.value.trim();
        if (!name) return toast('Dê um nome para a CEG', 'surpreso');
        const data = { name, item: f.item.value.trim(), date: f.date.value || today(), cost: inputToCents(f.cost.value), note: f.note.value.trim() };
        if (c) { D.update('cegs', c.id, data); close(); toast('CEG atualizada'); return; }
        let expenseTxId = '';
        if (f.asTx.checked && data.cost > 0) {
          const cc = categories('expense').find((x) => norm(x.name) === 'cegs') || categories('expense')[0];
          expenseTxId = D.add('transactions', { type: 'expense', amount: data.cost, date: data.date, desc: data.name, categoryId: cc?.id || '', accountId: f.acc.value, toAccountId: '', paid: true, note: 'CEG' });
        }
        const nid = D.add('cegs', { ...data, status: 'aberta', participants: [], expenseTxId });
        close();
        toast('CEG criada 💿');
        setTimeout(() => openCeg(nid), 300);
      });
    },
  });
}
function openCeg(id) {
  const body = () => {
    const c = db.cegs.find((x) => x.id === id);
    if (!c) return '<p class="muted">CEG não encontrada.</p>';
    const ps = c.participants || [];
    const tot = cegShare(c), rec = cegReceived(c);
    const lucro = tot - (c.cost || 0);
    return `
    <div class="ceg-h" style="margin-bottom:14px"><span class="tx-ic" style="--c:#BA68C8">💿</span><div style="flex:1;min-width:0"><b>${esc(c.name)}</b><small>${[esc(c.item || ''), c.date ? shortDate(c.date) : ''].filter(Boolean).join(' · ')}</small></div><span class="tag ${c.status === 'encerrada' ? 'closed' : ''}">${c.status === 'encerrada' ? 'Encerrada' : 'Aberta'}</span></div>
    <div class="stat-row"><div><span>Você pagou</span><b>${brl(c.cost)}</b></div><div><span>Recebido</span><b style="color:var(--income)">${brl(rec)}</b></div><div><span>Falta receber</span><b style="color:var(--warn)">${brl(tot - rec)}</b></div></div>
    ${c.cost && tot ? `<p class="muted" style="margin:-4px 0 12px;font-size:13px;font-weight:700">${lucro === 0 ? 'Divisão fecha certinho com o que você pagou.' : lucro > 0 ? `A soma das partes passa ${brl(lucro)} do que você pagou.` : `Ainda faltam ${brl(-lucro)} para cobrir o que você pagou.`}</p>` : ''}
    <div class="fld"><span>Participantes (${ps.length})</span>
      <div class="people">${ps.length ? ps.map((p, i) => `<div class="person"><span class="av">${esc(initials(p.name))}</span><span class="nm">${esc(p.name)}<small>${brl(p.share)}${p.item ? ' · ' + esc(p.item) : ''}</small></span>
        <button class="st ${p.paid ? 'paid' : 'pend'}" data-act="cegPaid" data-id="${c.id}" data-i="${i}">${ic(p.paid ? 'check' : 'clock', 12)}${p.paid ? 'pagou' : 'pendente'}</button>
        <button class="icon-btn flat" data-act="cegDelP" data-id="${c.id}" data-i="${i}" aria-label="Remover">${ic('x', 16)}</button></div>`).join('') : `<div class="person"><span class="nm muted">Ninguém ainda. Adicione abaixo 👇</span></div>`}</div>
    </div>
    <form class="add-person" id="addP" autocomplete="off"><input class="input" name="n" placeholder="Nome ou @" maxlength="40"><input class="input money" name="v" inputmode="numeric" placeholder="0,00" value="${ps.length && c.cost ? centsToInput(Math.round(c.cost / (ps.length + 1))) : '0,00'}"><button class="btn primary" aria-label="Adicionar">${ic('plus', 18)}</button></form>
    <div class="chips" style="margin-bottom:14px">
      ${ps.length && c.cost ? `<button class="chip" data-act="cegSplit" data-id="${c.id}">${ic('split', 14)} Dividir ${brl(c.cost)} igualmente</button>` : ''}
      ${ps.some((p) => p.paid && !p.launched) ? `<button class="chip on" data-act="cegLaunch" data-id="${c.id}">${ic('down', 14)} Lançar recebidos no caixa</button>` : ''}
      <button class="chip" data-act="cegCopy" data-id="${c.id}">📋 Copiar cobrança</button>
    </div>
    ${c.note ? `<p class="muted" style="font-weight:700;font-size:13px">📝 ${esc(c.note)}</p>` : ''}
    <div class="sheet-actions">
      <button class="btn danger" data-act="cegDel" data-id="${c.id}">${ic('trash', 18)}</button>
      <button class="btn ghost" data-act="editCeg" data-id="${c.id}">${ic('edit', 16)} Editar</button>
      <button class="btn primary" data-act="cegStatus" data-id="${c.id}">${c.status === 'encerrada' ? 'Reabrir' : 'Encerrar CEG'}</button>
    </div>`;
  };
  const mount = (w) => {
    const f = $('#addP', w);
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const c = db.cegs.find((x) => x.id === id);
      const name = f.n.value.trim();
      if (!name) return toast('Digite o nome', 'surpreso');
      D.update('cegs', id, { participants: [...(c.participants || []), { name, share: inputToCents(f.v.value), paid: false, launched: false }] });
      setTimeout(() => $('#addP input[name=n]')?.focus(), 50);
    });
  };
  const refresh = () => { const w = $('#cegSheet')?.closest('.sheet-wrap'); if (!w) return; const sb = $('.sheet-b', w); const st = sb.scrollTop; $('#cegSheet', w).innerHTML = body(); sb.scrollTop = st; mount(w); };
  sheet('CEG', `<div id="cegSheet">${body()}</div>`, { onMount: (w) => mount(w), refresh });
}
const cegAct = {
  cegPaid: (c, i) => { const ps = [...c.participants]; ps[i] = { ...ps[i], paid: !ps[i].paid }; D.update('cegs', c.id, { participants: ps }); if (ps[i].paid) toast(`${esc(ps[i].name)} pagou 💸`, 'comemorando'); },
  cegDelP: (c, i) => { const ps = c.participants.filter((_, j) => j !== i); D.update('cegs', c.id, { participants: ps }); },
  cegSplit: (c) => { const n = c.participants.length; const base = Math.floor(c.cost / n); const ps = c.participants.map((p, i) => ({ ...p, share: i === 0 ? c.cost - base * (n - 1) : base })); D.update('cegs', c.id, { participants: ps }); toast('Valor dividido'); },
  cegLaunch: (c) => {
    const cc = categories('income').find((x) => /ceg/i.test(x.name)) || categories('income')[0];
    const accId = accounts().find((a) => !isCard(a))?.id;
    const items = c.participants.filter((p) => p.paid && !p.launched).map((p) => ({ type: 'income', amount: p.share, date: today(), desc: `${c.name} — ${p.name}`, categoryId: cc?.id || '', accountId: accId, toAccountId: '', paid: true, note: 'CEG' }));
    D.addMany('transactions', items);
    D.update('cegs', c.id, { participants: c.participants.map((p) => (p.paid ? { ...p, launched: true } : p)) });
    toast(`${items.length} ${items.length === 1 ? 'recebimento lançado' : 'recebimentos lançados'}`, 'comemorando');
  },
  cegCopy: (c) => {
    const pend = (c.participants || []).filter((p) => !p.paid);
    const txt = `💿 ${c.name}${c.item ? ' — ' + c.item : ''}\n\n${(c.participants || []).map((p) => `${p.paid ? '✅' : '⏳'} ${p.name}: ${brl(p.share)}`).join('\n')}\n\n${pend.length ? `Faltam ${pend.length} pagamento(s) 💚` : 'Todo mundo pagou, obrigada! 💚'}`;
    navigator.clipboard?.writeText(txt).then(() => toast('Cobrança copiada')).catch(() => toast('Não consegui copiar', 'surpreso'));
  },
  cegStatus: (c) => { D.update('cegs', c.id, { status: c.status === 'encerrada' ? 'aberta' : 'encerrada' }); toast(c.status === 'encerrada' ? 'CEG reaberta' : 'CEG encerrada'); },
  cegDel: async (c, i, btn) => {
    if (await confirmBox(`Excluir a CEG <b>${esc(c.name)}</b>? Os lançamentos já feitos continuam no extrato.`, { ok: 'Excluir', danger: true })) { D.remove('cegs', c.id); btn.closest('.sheet-wrap')?.close(); toast('CEG excluída'); }
  },
};

/* =========================================================
   Categorias e orçamentos
   ========================================================= */
VIEWS.categorias = () => {
  const spent = spentByCategory(ymOf(today()));
  const list = categories(S.catTab);
  return `
  <header class="top"><h1>Categorias</h1><div class="top-act"><button class="btn primary sm" data-act="newCat">${ic('plus', 16)} Nova</button></div></header>
  <div class="seg" style="margin-bottom:14px;max-width:360px"><button data-act="catTab" data-t="expense" class="${S.catTab === 'expense' ? 'on' : ''}">Despesas</button><button data-act="catTab" data-t="income" class="${S.catTab === 'income' ? 'on' : ''}">Receitas</button></div>
  ${S.catTab === 'expense' ? `<div class="bubble">${brotinho('piscando', 46, '')}<p>Toque numa categoria para definir um <b>orçamento mensal</b>. Eu te aviso quando estiver chegando perto do limite!</p></div>` : ''}
  <div class="menu">${list.map((c) => {
    const s = spent.get(c.id) || 0; const p = c.budget ? s / c.budget : 0;
    return `<button data-act="editCat" data-id="${c.id}"><span class="mi" style="background:color-mix(in srgb, ${c.color} 22%, transparent);font-size:19px">${c.emoji}</span><span class="mt">${esc(c.name)}${c.type === 'expense' ? `<small>${c.budget ? `${money(s)} de ${money(c.budget)} este mês` : 'Sem orçamento'}</small>${c.budget ? `<div class="bar ${p > 1 ? 'over' : p > .8 ? 'warn' : ''}" style="margin-top:6px;height:6px"><i style="width:${Math.min(p, 1) * 100}%"></i></div>` : ''}` : ''}</span>${ic('chevR', 18)}</button>`;
  }).join('') || `<div style="padding:16px">${emptyState('surpreso', 'Nenhuma categoria', 'Crie a primeira.')}</div>`}</div>`;
};
function openCat(id = null) {
  const c = id ? db.categories.find((x) => x.id === id) : null;
  const v = c || { name: '', emoji: '🌱', color: COLORS[0], type: S.catTab, budget: 0 };
  sheet(c ? 'Editar categoria' : 'Nova categoria', `<form id="catForm" autocomplete="off">
    <label class="fld"><span>Nome</span><input name="name" value="${esc(v.name)}" required maxlength="30"></label>
    <label class="fld"><span>Tipo</span><select name="type"><option value="expense" ${v.type === 'expense' ? 'selected' : ''}>Despesa</option><option value="income" ${v.type === 'income' ? 'selected' : ''}>Receita</option></select></label>
    <label class="fld" id="budFld" ${v.type === 'expense' ? '' : 'hidden'}><span>Orçamento mensal (0 = sem limite)</span><input class="money" name="budget" inputmode="numeric" value="${centsToInput(v.budget)}"></label>
    <div class="fld"><span>Ícone</span>${emojiPick('emoji', v.emoji)}</div>
    <div class="fld"><span>Cor</span>${swatches('color', v.color)}</div>
    <div class="sheet-actions">${c ? `<button type="button" class="btn danger" id="catDel">${ic('trash', 18)}</button>` : ''}<button class="btn primary">${c ? 'Salvar' : 'Criar categoria'}</button></div>
  </form>`, {
    onMount: (w, close) => {
      const f = $('#catForm', w);
      f.type.onchange = () => ($('#budFld', w).hidden = f.type.value !== 'expense');
      $('#catDel', w)?.addEventListener('click', async () => {
        const n = db.transactions.filter((t) => t.categoryId === c.id).length;
        if (await confirmBox(`Excluir <b>${esc(c.name)}</b>?${n ? ` ${n} lançamento(s) vão ficar como “Sem categoria”.` : ''}`, { ok: 'Excluir', danger: true })) { D.remove('categories', c.id); close(); toast('Categoria excluída'); }
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = f.name.value.trim();
        if (!name) return toast('Dê um nome', 'surpreso');
        const data = { name, type: f.type.value, budget: f.type.value === 'expense' ? inputToCents(f.budget.value) : 0, emoji: $('input[name=emoji]:checked', w)?.value || '🌱', color: $('input[name=color]:checked', w)?.value || COLORS[0] };
        if (c) D.update('categories', c.id, data); else D.add('categories', { ...data, order: db.categories.length });
        toast(c ? 'Categoria atualizada' : 'Categoria criada');
        close();
      });
    },
  });
}

/* =========================================================
   Importar extrato
   ========================================================= */
VIEWS.importar = () => {
  if (S.importRows) return importPreview();
  return `
  <header class="top"><h1>Importar extrato</h1></header>
  <div class="bubble">${brotinho('piscando', 46, '')}<p>Me mande o extrato do banco que eu preencho os lançamentos pra você. Aceito <b>CSV, Excel (XLSX), OFX e PDF</b>.</p></div>
  <label class="drop" id="drop">${ic('upload', 34)}<b>Escolher arquivo do extrato</b><small>ou arraste aqui · CSV, XLSX, XLS, OFX, PDF</small><input type="file" id="impFile" accept=".csv,.txt,.xlsx,.xls,.ofx,.pdf" hidden></label>
  <div class="card" style="margin-top:14px">
    <h2>Ou cole o texto do extrato</h2>
    <textarea class="input" id="impText" rows="6" placeholder="Ex.:&#10;05/11/2026 IFOOD *RESTAURANTE   -42,90&#10;06/11/2026 PIX RECEBIDO MARIA   35,00"></textarea>
    <div style="height:10px"></div>
    <button class="btn soft" data-act="impText">Ler texto</button>
  </div>
  <div class="card" style="margin-top:14px"><h2>Dicas</h2>
    <ul class="steps" style="margin:0"><li>No app do banco, procure <b>Exportar extrato</b> e escolha CSV, OFX ou Excel: são os formatos mais certeiros.</li><li>Lançamentos que já existem (mesma data, valor e descrição) ficam desmarcados.</li><li>Fatura de cartão costuma vir com valores positivos: use <b>Inverter sinais</b> na conferência.</li></ul>
  </div>`;
};
AFTER.importar = () => {
  if (S.importRows) return AFTER_importPreview();
  const drop = $('#drop'), inp = $('#impFile');
  drop.addEventListener('click', (e) => { if (e.target !== inp) { e.preventDefault(); inp.click(); } });
  inp.addEventListener('change', () => inp.files[0] && readImport(inp.files[0]));
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) readImport(f); });
};
async function readImport(file) {
  toast('Lendo o extrato…', 'piscando');
  try {
    const rows = await parseFile(file);
    setImportRows(rows, file.name);
  } catch (e) {
    console.error(e);
    toast('Não consegui ler esse arquivo. Tente CSV ou cole o texto.', 'preocupado');
  }
}
function setImportRows(rows, source) {
  if (!rows.length) return toast('Não encontrei lançamentos nesse extrato', 'preocupado');
  const defAcc = accounts().find((a) => !isCard(a))?.id || accounts()[0]?.id;
  S.importRows = rows.map((r) => {
    const type = r.amount < 0 ? 'expense' : 'income';
    const dup = db.transactions.some((t) => t.date === r.date && t.amount === Math.abs(r.amount) && norm(t.desc) === norm(r.desc));
    return { ...r, type, sel: !dup, dup, categoryId: guessCategory(r.desc, type, db.categories) };
  });
  S.importMeta = { source, accountId: defAcc };
  renderView();
}
function importPreview() {
  const rows = S.importRows;
  const sel = rows.filter((r) => r.sel);
  const inc = sel.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const exp = sel.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0);
  return `
  <header class="top"><h1>Conferir importação</h1><div class="top-act"><button class="btn ghost sm" data-act="impCancel">Cancelar</button></div></header>
  <div class="bubble">${brotinho('feliz', 46, '')}<p>Achei <b>${rows.length}</b> lançamentos em <b>${esc(S.importMeta.source)}</b>. Confira as categorias e toque em importar.</p></div>
  <div class="sumrow"><div class="sum"><span>Selecionados</span><b>${sel.length}</b></div><div class="sum inc"><span>Entradas</span><b>${brl(inc)}</b></div><div class="sum exp"><span>Saídas</span><b>${brl(exp)}</b></div></div>
  <div class="card">
    <div class="row2" style="align-items:end">
      <label class="fld"><span>Importar para a conta</span><select id="impAcc">${accOptions(S.importMeta.accountId)}</select></label>
      <div class="fld"><span>Ajustes</span><div class="chips"><button class="chip" data-act="impInvert">⇅ Inverter sinais</button><button class="chip" data-act="impAll">Marcar todos</button></div></div>
    </div>
    <div class="scroll-x"><table class="imp-table"><thead><tr><th></th><th>Data</th><th>Descrição</th><th>Categoria</th><th style="text-align:right">Valor</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${r.dup ? 'dup' : ''}"><td><input type="checkbox" data-i="${i}" class="impSel" ${r.sel ? 'checked' : ''}></td><td>${shortDate(r.date)}</td><td>${esc(r.desc)}${r.dup ? ' <span class="tag closed">já existe</span>' : ''}</td><td><select class="impCat" data-i="${i}">${catOptions(r.type, r.categoryId)}</select></td><td class="v amt ${r.amount < 0 ? 'expense' : 'income'}">${brl(r.amount)}</td></tr>`).join('')}
    </tbody></table></div>
    <div style="height:14px"></div>
    <button class="btn primary block" data-act="impGo" ${sel.length ? '' : 'disabled'}>Importar ${sel.length} ${sel.length === 1 ? 'lançamento' : 'lançamentos'}</button>
  </div>`;
}
function AFTER_importPreview() {
  $('#impAcc').addEventListener('change', (e) => (S.importMeta.accountId = e.target.value));
  $$('.impSel').forEach((c) => c.addEventListener('change', () => { S.importRows[c.dataset.i].sel = c.checked; renderView(); }));
  $$('.impCat').forEach((s) => s.addEventListener('change', () => (S.importRows[s.dataset.i].categoryId = s.value)));
}

/* =========================================================
   Mais / ajustes
   ========================================================= */
VIEWS.mais = () => {
  const theme = ls('broto_theme') || 'auto';
  return `
  <header class="top"><h1>Mais</h1></header>
  <div class="card profile-card"><span class="avatar">${esc(initials(userName()))}</span><div style="flex:1;min-width:0"><b style="font-size:17px">${esc(userName() || 'Você')}</b><div class="muted" style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis">${esc(S.user?.email || '')}${D.DEMO ? ' · modo demonstração' : ''}</div></div><button class="btn soft sm" data-act="editName">${ic('edit', 16)} Editar</button></div>
  <div class="menu">
    <a href="#/contas"><span class="mi">${ic('wallet')}</span><span class="mt">Contas e cartões<small>Saldos, faturas e limites</small></span>${ic('chevR', 18)}</a>
    <a href="#/cofres"><span class="mi">${ic('piggy')}</span><span class="mt">Cofres<small>Guarde dinheiro por objetivo</small></span>${ic('chevR', 18)}</a>
    <a href="#/cegs"><span class="mi">${ic('box')}</span><span class="mt">CEGs<small>Compras em grupo e quem já pagou</small></span>${ic('chevR', 18)}</a>
    <a href="#/categorias"><span class="mi">${ic('tag')}</span><span class="mt">Categorias e orçamentos<small>Limites mensais por categoria</small></span>${ic('chevR', 18)}</a>
    <a href="#/importar"><span class="mi">${ic('upload')}</span><span class="mt">Importar extrato<small>CSV, Excel, OFX e PDF</small></span>${ic('chevR', 18)}</a>
  </div>
  <div class="menu">
    <div style="padding:14px 16px;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:14px;margin-bottom:10px"><span class="mi" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary-strong)">${ic('sun')}</span><b>Aparência</b></div>
      <div class="seg">${[['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Automático']].map(([k, l]) => `<button data-act="theme" data-t="${k}" class="${theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <button data-act="hide"><span class="mi">${ic(S.hide ? 'eyeoff' : 'eye')}</span><span class="mt">${S.hide ? 'Mostrar valores' : 'Esconder valores'}<small>Para abrir o app em público sem mostrar o saldo</small></span></button>
    ${isStandalone() ? '' : `<button data-act="install"><span class="mi">${ic('phone')}</span><span class="mt">Instalar no celular<small>Ícone na tela inicial, abre como app</small></span>${ic('chevR', 18)}</button>`}
  </div>
  <div class="menu">
    <button data-act="exportCsv"><span class="mi">${ic('file')}</span><span class="mt">Exportar lançamentos (CSV)<small>Abre no Excel ou Google Planilhas</small></span>${ic('download', 18)}</button>
    <button data-act="backup"><span class="mi">${ic('download')}</span><span class="mt">Fazer backup<small>Baixa tudo num arquivo .json</small></span></button>
    <button data-act="restore"><span class="mi">${ic('upload')}</span><span class="mt">Restaurar backup<small>Adiciona os dados de um arquivo .json</small></span></button>
    ${D.DEMO ? '' : `<button data-act="resetPw"><span class="mi">${ic('user')}</span><span class="mt">Trocar senha<small>Enviamos um link para seu e-mail</small></span></button>`}
  </div>
  <div class="menu">
    <button data-act="about"><span class="mi">${ic('leaf')}</span><span class="mt">Sobre o Brotinho<small>Broto · versão 2.0</small></span></button>
    <button data-act="logout"><span class="mi" style="background:var(--expense-soft);color:var(--expense)">${ic('logout')}</span><span class="mt" style="color:var(--expense)">Sair da conta</span></button>
  </div>`;
};

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportCsv() {
  const rows = [['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Para conta', 'Valor', 'Status', 'Observação']];
  const tp = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' };
  for (const t of [...db.transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    const v = (t.type === 'expense' ? -t.amount : t.amount) / 100;
    rows.push([t.date.split('-').reverse().join('/'), t.desc, tp[t.type], cat(t.categoryId)?.name || '', acc(t.accountId)?.name || '', acc(t.toAccountId)?.name || '', v.toFixed(2).replace('.', ','), t.paid ? 'Pago' : 'Pendente', t.note || '']);
  }
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(`broto-lancamentos-${today()}.csv`, csv, 'text/csv;charset=utf-8');
  toast('Planilha baixada');
}
function backup() {
  const data = { app: 'broto', version: 2, exportedAt: new Date().toISOString(), profile: db.profile };
  for (const c of D.COLS) data[c] = db[c];
  download(`broto-backup-${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Backup baixado 🌱');
}
function restore() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (data.app !== 'broto') throw new Error('arquivo inválido');
      const n = D.COLS.reduce((s, c) => s + (data[c]?.length || 0), 0);
      if (!(await confirmBox(`Restaurar <b>${n}</b> itens deste backup? Itens com o mesmo ID serão substituídos.`, { ok: 'Restaurar' }))) return;
      for (const c of D.COLS) if (Array.isArray(data[c])) D.addMany(c, data[c]);
      toast('Backup restaurado', 'comemorando');
    } catch (e) { toast('Esse arquivo não é um backup do Broto', 'preocupado'); }
  };
  inp.click();
}

/* =========================================================
   Instalação (PWA)
   ========================================================= */
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; S.canInstall = true; if (S.shell && ['inicio', 'mais'].includes(S.route)) renderView(); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; S.canInstall = false; toast('Broto instalado! 🌱', 'comemorando'); if (S.shell) renderView(); });
async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null; S.canInstall = false;
    if (S.shell) renderView();
    return;
  }
  sheet('Instalar o Broto', `<div class="center-hero">${brotinho('feliz', 100, 'sway')}<p>Coloque o Broto na tela inicial e use como app, até sem internet.</p></div>
    ${isIOS ? `<ol class="steps"><li>Abra este site no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> (quadrado com seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b>.</li></ol>`
    : `<ol class="steps"><li>Abra este site no <b>Chrome</b>.</li><li>Toque no menu <b>⋮</b> no canto de cima.</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li></ol>`}
    <button class="btn primary block" data-close>Entendi</button>`);
}

/* =========================================================
   Tema
   ========================================================= */
function applyTheme() {
  const pref = ls('broto_theme') || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0D1611' : '#F1F8EE');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* =========================================================
   Boas-vindas
   ========================================================= */
function maybeOnboard() {
  if (S.onboardShown || !db.profile || db.profile.onboarded !== false) return;
  S.onboardShown = true;
  const main = accounts().find((a) => a.type === 'corrente') || accounts()[0];
  sheet('Bem-vinda ao Broto!', `<form id="onbForm">
    <div class="center-hero">${brotinho('comemorando', 140, 'bounce')}<h2 style="font-size:22px">Oi${userName() ? ', ' + esc(userName().split(' ')[0]) : ''}! Eu sou o Brotinho 🌱</h2><p>Vou te ajudar a cuidar do seu dinheiro. Pra começar: quanto você tem hoje na sua conta principal?</p></div>
    <label class="amount-fld income"><span>R$</span><input class="money" name="v" inputmode="numeric" value="0,00"></label>
    <label class="fld"><span>Nome da conta</span><input name="n" value="${esc(main?.name || 'Conta principal')}" maxlength="40"></label>
    <div class="sheet-actions"><button type="button" class="btn ghost" id="onbSkip">Depois</button><button class="btn primary">Começar a plantar</button></div>
  </form>`, {
    onMount: (w, close) => {
      const f = $('#onbForm', w);
      $('#onbSkip', w).onclick = () => { D.updateProfile({ onboarded: true }); close(); };
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (main) D.update('accounts', main.id, { initial: inputToCents(f.v.value), name: f.n.value.trim() || main.name });
        D.updateProfile({ onboarded: true });
        close();
        toast('Tudo pronto! Bora crescer 🌱', 'comemorando');
      });
    },
  });
}

/* =========================================================
   Ações (cliques)
   ========================================================= */
const ACT = {
  authTab: (b) => { authMode = b.dataset.tab; renderAuth(); },
  togglePw: (b) => { const i = b.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', show ? 'Esconder senha' : 'Mostrar senha'); },
  forgot: async () => {
    const email = $('#authForm').email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return authMsg('Digite seu e-mail acima e toque em “Esqueci minha senha” de novo.');
    try { await D.resetPassword(email); authMsg('Enviamos um link para redefinir sua senha. Confira seu e-mail (e o spam) 💌', true); } catch (e) { authMsg(D.authError(e)); }
  },
  google: async () => { try { await D.signInGoogle(); location.hash = '#/inicio'; } catch (e) { console.error(e); authMsg(D.authError(e)); } },
  logout: async () => { if (await confirmBox('Sair da sua conta neste aparelho?', { ok: 'Sair', mood: 'dormindo' })) { await D.signOut(); S.onboardShown = false; } },
  month: (b) => { S.month = addMonths(S.month, Number(b.dataset.d)); renderView(); },
  hide: () => { S.hide = !S.hide; ls('broto_hide', S.hide ? '1' : '0'); renderView(); },
  go: (b) => { location.hash = '#/' + b.dataset.r; },
  newTx: (b) => openTx({ type: b.dataset.type || 'expense', preset: b.dataset.from ? { accountId: b.dataset.from } : {} }),
  editTx: (b) => openTx({ id: b.dataset.id }),
  togglePaid: (b) => { const t = db.transactions.find((x) => x.id === b.dataset.id); if (!t) return; D.update('transactions', t.id, { paid: !t.paid }); toast(!t.paid ? (t.type === 'income' ? 'Marcado como recebido 💚' : 'Marcado como pago ✅') : 'Marcado como pendente', !t.paid ? 'feliz' : 'piscando'); },
  txFilter: (b) => { S.txFilter = b.dataset.f; renderView(); },
  filterPend: () => { S.txFilter = 'pendentes'; },
  newAcc: (b) => openAcc(null, b.dataset.type || 'corrente'),
  editAcc: (b) => openAcc(b.dataset.id),
  seeAcc: (b) => { S.txAccount = b.dataset.id; S.txFilter = 'todos'; location.hash = '#/lancamentos'; },
  payCard: (b) => {
    const a = acc(b.dataset.id); const fat = Math.max(0, -balance(a));
    openTx({ type: 'transfer', preset: { toAccountId: a.id, accountId: accounts().find((x) => !isCard(x))?.id, amount: fat, desc: `Pagamento fatura ${a.name}` } });
  },
  newEnv: () => openEnv(),
  editEnv: (b) => openEnv(b.dataset.id),
  envMove: (b) => envMove(b.dataset.id, b.dataset.op),
  newCeg: () => openCegForm(),
  openCeg: (b) => openCeg(b.dataset.id),
  editCeg: (b) => { b.closest('.sheet-wrap')?.close(); setTimeout(() => openCegForm(b.dataset.id), 250); },
  cegTab: (b) => { S.cegTab = b.dataset.t; renderView(); },
  newCat: () => openCat(),
  editCat: (b) => openCat(b.dataset.id),
  catTab: (b) => { S.catTab = b.dataset.t; renderView(); },
  impText: () => { const t = $('#impText').value; if (!t.trim()) return toast('Cole o texto do extrato', 'surpreso'); setImportRows(parseText(t), 'texto colado'); },
  impCancel: () => { S.importRows = null; renderView(); },
  impInvert: () => { S.importRows.forEach((r) => { r.amount = -r.amount; r.type = r.amount < 0 ? 'expense' : 'income'; r.categoryId = guessCategory(r.desc, r.type, db.categories); }); renderView(); },
  impAll: () => { const all = S.importRows.every((r) => r.sel); S.importRows.forEach((r) => (r.sel = !all)); renderView(); },
  impGo: () => {
    const accId = S.importMeta.accountId;
    const items = S.importRows.filter((r) => r.sel).map((r) => ({ type: r.amount < 0 ? 'expense' : 'income', amount: Math.abs(r.amount), date: r.date, desc: r.desc.slice(0, 80), categoryId: r.categoryId, accountId: accId, toAccountId: '', paid: true, note: 'importado' }));
    D.addMany('transactions', items);
    S.importRows = null;
    const latest = items.map((i) => i.date).sort().pop();
    if (latest) S.month = ymOf(latest);
    toast(`${items.length} lançamentos importados 🌱`, 'comemorando');
    location.hash = '#/lancamentos';
  },
  theme: (b) => { ls('broto_theme', b.dataset.t); applyTheme(); renderView(); },
  install: () => install(),
  dismissInstall: () => { ls('broto_install_dismiss', '1'); renderView(); },
  exportCsv: () => exportCsv(),
  backup: () => backup(),
  restore: () => restore(),
  resetPw: async () => { try { await D.resetPassword(S.user.email); toast('Link enviado para seu e-mail 💌'); } catch (e) { toast(D.authError(e), 'preocupado'); } },
  editName: () => sheet('Seu nome', `<form id="nmForm"><label class="fld"><span>Como o Brotinho te chama</span><input name="n" value="${esc(userName())}" maxlength="40"></label><div class="sheet-actions"><button class="btn primary">Salvar</button></div></form>`, {
    onMount: (w, close) => $('#nmForm', w).addEventListener('submit', (e) => { e.preventDefault(); const n = e.target.n.value.trim(); if (n) { D.updateProfile({ name: n }); if (S.user) S.user.name = n; } close(); toast('Prazer, ' + esc(n.split(' ')[0]) + '!'); }),
  }),
  about: () => sheet('Sobre o Brotinho', `<div class="center-hero">${brotinho('comemorando', 150, 'bounce')}<h2 style="font-size:22px">Brotinho</h2><p>O mascote do Broto nasceu de uma sementinha que decidiu guardar cada moeda que caía no vaso. Ele fica feliz quando seu mês fecha no verde, comemora quando você bate uma meta e fica preocupadinho quando o orçamento estoura. Cuide bem dele 💚</p></div>
    <div class="stat-row"><div><span>Lançamentos</span><b>${db.transactions.length}</b></div><div><span>Cofres</span><b>${db.envelopes.length}</b></div><div><span>CEGs</span><b>${db.cegs.length}</b></div></div>
    <button class="btn primary block" data-close>Fechar</button>`),
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  if (cegAct[a]) {
    e.stopPropagation();
    const c = db.cegs.find((x) => x.id === el.dataset.id);
    if (c) cegAct[a](c, Number(el.dataset.i), el);
    return;
  }
  if (ACT[a]) {
    if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault();
    ACT[a](el, e);
  }
});
// máscara de dinheiro estilo app de banco (digita 1234 → 12,34)
document.addEventListener('input', (e) => {
  if (!e.target.matches('input.money')) return;
  const c = inputToCents(e.target.value);
  e.target.value = centsToInput(c);
});
document.addEventListener('focusin', (e) => { if (e.target.matches('input.money')) setTimeout(() => e.target.select?.(), 0); });

/* =========================================================
   Rotas e inicialização
   ========================================================= */
function route() {
  const r = (location.hash.replace(/^#\/?/, '') || 'inicio').split('?')[0];
  S.route = VIEWS[r] ? r : 'inicio';
  if (S.route !== 'importar') S.importRows = S.route === 'importar' ? S.importRows : null;
  if (S.user && db.ready) { renderView(); window.scrollTo({ top: 0 }); }
}
window.addEventListener('hashchange', route);

function splash(text = 'Regando seu broto…') {
  document.getElementById('app').innerHTML = `<div class="splash"><div>${brotinho('feliz', 130, 'bounce')}<div class="brand" style="justify-content:center">Broto</div><p>${text}</p></div></div>`;
}

D.onData(() => {
  if (!S.user || !db.ready) return;
  if (!S.shell) renderShell(); else renderView();
  S.sheetRefresh?.();
  maybeOnboard();
});

applyTheme();
splash();
route();
D.init((user) => {
  S.user = user;
  if (user) { splash(); D.start(user); }
  else { D.stop(); S.shell = false; renderAuth(); }
}).catch((e) => {
  console.error(e);
  splash('Não consegui conectar. Confira sua internet e recarregue a página.');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
