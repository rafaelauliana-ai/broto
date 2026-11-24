// Importação de extratos: CSV, OFX, XLSX/XLS, PDF e texto colado.
// Cada linha vira { date: 'AAAA-MM-DD', desc, amount } com amount em centavos (negativo = saída).

const pad = (n) => String(n).padStart(2, '0');
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function parseDate(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && v > 20000 && v < 80000) { // data serial do Excel
    const d = new Date(Math.round((v - 25569) * 86400000));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/);
  if (m) {
    let y = m[3] ? Number(m[3]) : new Date().getFullYear();
    if (y < 100) y += 2000;
    const d = Number(m[1]), mo = Number(m[2]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  m = s.match(/^(\d{4})(\d{2})(\d{2})/); // OFX
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const meses = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
  m = norm(s).match(/^(\d{1,2})\s*(?:de\s*)?([a-z]{3})[a-z]*\.?\s*(?:de\s*)?(\d{4})?/);
  if (m && meses[m[2]]) return `${m[3] || new Date().getFullYear()}-${pad(meses[m[2]])}-${pad(m[1])}`;
  return null;
}

export function parseAmount(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Math.round(v * 100);
  let s = String(v).trim();
  if (!/\d/.test(s)) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/\bD$/i.test(s) || /-\s*$/.test(s)) neg = true;
  s = s.replace(/[^\d,.\-]/g, '');
  if (s.includes('-')) neg = true;
  s = s.replace(/-/g, '');
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > -1 && ld > -1) {
    s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lc > -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (ld > -1) {
    const after = s.length - ld - 1;
    if ((s.match(/\./g) || []).length > 1 || after === 3) s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return Math.round(n * 100) * (neg ? -1 : 1);
}

/* ---------- CSV ---------- */
function splitCSV(text) {
  const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const counts = { ';': (first.match(/;/g) || []).length, ',': (first.match(/,/g) || []).length, '\t': (first.match(/\t/g) || []).length };
  const sep = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

/* ---------- tabela genérica (CSV/XLSX) ---------- */
export function rowsFromTable(table) {
  table = table.filter((r) => r && r.some((c) => String(c ?? '').trim() !== ''));
  if (!table.length) return [];
  const K = {
    date: ['data', 'date', 'dt', 'dia'],
    desc: ['descri', 'histor', 'lancamento', 'title', 'titulo', 'estabelecimento', 'memo', 'detalhe', 'nome'],
    amount: ['valor', 'amount', 'quantia', 'montante', 'value'],
    credit: ['credito', 'entrada', 'receita'],
    debit: ['debito', 'saida', 'despesa'],
  };
  let hIdx = -1, cols = {};
  for (let i = 0; i < Math.min(table.length, 15); i++) {
    const r = table[i].map(norm);
    const find = (keys) => r.findIndex((c) => c && keys.some((k) => c.includes(k)));
    const c = { date: find(K.date), desc: find(K.desc), amount: find(K.amount), credit: find(K.credit), debit: find(K.debit) };
    if (c.date > -1 && (c.amount > -1 || c.credit > -1 || c.debit > -1)) { hIdx = i; cols = c; break; }
  }
  let body = hIdx > -1 ? table.slice(hIdx + 1) : table;
  if (hIdx === -1) {
    // sem cabeçalho: descobre pelas colunas
    const n = Math.max(...body.map((r) => r.length));
    const score = (fn) => [...Array(n).keys()].map((j) => body.filter((r) => fn(r[j])).length);
    const ds = score((v) => !!parseDate(v));
    const as = score((v) => parseAmount(v) !== null && !parseDate(v));
    const ts = [...Array(n).keys()].map((j) => body.reduce((s, r) => s + (isNaN(parseAmount(r[j])) || parseAmount(r[j]) === null ? String(r[j] ?? '').length : 0), 0));
    cols.date = ds.indexOf(Math.max(...ds));
    as[cols.date] = -1;
    cols.amount = as.lastIndexOf(Math.max(...as));
    ts[cols.date] = -1; ts[cols.amount] = -1;
    cols.desc = ts.indexOf(Math.max(...ts));
    cols.credit = cols.debit = -1;
  }
  if (cols.desc === -1) cols.desc = [...Array(table[0].length).keys()].find((j) => j !== cols.date && j !== cols.amount) ?? 0;
  const out = [];
  for (const r of body) {
    const date = parseDate(r[cols.date]);
    if (!date) continue;
    let amount = null;
    if (cols.amount > -1) amount = parseAmount(r[cols.amount]);
    if ((amount === null || amount === 0) && (cols.credit > -1 || cols.debit > -1)) {
      const cr = cols.credit > -1 ? parseAmount(r[cols.credit]) : null;
      const db = cols.debit > -1 ? parseAmount(r[cols.debit]) : null;
      if (cr) amount = Math.abs(cr);
      else if (db) amount = -Math.abs(db);
    }
    if (amount === null || amount === 0) continue;
    const desc = String(r[cols.desc] ?? '').trim() || 'Lançamento importado';
    out.push({ date, desc, amount });
  }
  return out;
}

/* ---------- OFX ---------- */
function parseOFX(text) {
  const out = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tag = (b, t) => { const m = b.match(new RegExp('<' + t + '>([^<\\r\\n]*)', 'i')); return m ? m[1].trim() : ''; };
  for (const b of blocks) {
    const date = parseDate(tag(b, 'DTPOSTED'));
    const amount = parseAmount(tag(b, 'TRNAMT').replace(',', '.'));
    const desc = tag(b, 'MEMO') || tag(b, 'NAME') || 'Lançamento importado';
    if (date && amount) out.push({ date, desc, amount });
  }
  return out;
}

/* ---------- texto (PDF ou colado) ---------- */
export function parseText(text) {
  const out = [];
  const money = /(-?\s?R?\$?\s?-?\(?\d{1,3}(?:\.\d{3})*,\d{2}\)?\s?[DC]?-?)\s*$/i;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    const dm = line.match(/^(\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?|\d{1,2} ?(?:de )?[a-zç]{3}\.?(?: \d{4})?)\s+(.*)$/i);
    if (!dm) continue;
    const date = parseDate(dm[1]);
    if (!date) continue;
    let rest = dm[2];
    // se houver duas quantias (valor e saldo), usa a primeira
    const all = [...rest.matchAll(/-?\s?R?\$?\s?-?\(?\d{1,3}(?:\.\d{3})*,\d{2}\)?\s?[DC]?-?/gi)];
    if (!all.length) continue;
    const pick = all.length >= 2 ? all[all.length - 2] : all[all.length - 1];
    const amount = parseAmount(pick[0]);
    if (!amount) continue;
    const desc = rest.slice(0, pick.index).replace(money, '').trim() || 'Lançamento importado';
    out.push({ date, desc, amount });
  }
  return out;
}

async function pdfText(file) {
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const byY = new Map();
    for (const it of tc.items) {
      const y = Math.round(it.transform[5]);
      const key = [...byY.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      if (!byY.has(key)) byY.set(key, []);
      byY.get(key).push({ x: it.transform[4], s: it.str });
    }
    [...byY.entries()].sort((a, b) => b[0] - a[0]).forEach(([, its]) => lines.push(its.sort((a, b) => a.x - b.x).map((i) => i.s).join(' ')));
  }
  return lines.join('\n');
}

export async function parseFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'ofx') return parseOFX(await file.text());
  if (ext === 'pdf') return parseText(await pdfText(file));
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    let out = [];
    for (const name of wb.SheetNames) {
      const table = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
      out = out.concat(rowsFromTable(table));
    }
    return out;
  }
  // csv / txt
  let text = await file.text();
  if (text.includes('�')) { // provavelmente latin-1
    const buf = await file.arrayBuffer();
    text = new TextDecoder('iso-8859-1').decode(buf);
  }
  if (/<OFX>/i.test(text)) return parseOFX(text);
  const rows = rowsFromTable(splitCSV(text));
  return rows.length ? rows : parseText(text);
}

/* ---------- palpite de categoria ---------- */
const RULES = [
  ['CEGs', ['ceg', 'weverse', 'ktown', 'kpop', 'k-pop', 'photocard', 'album', 'pc ']],
  ['Mercado', ['mercado', 'supermerc', 'carrefour', 'assai', 'atacad', 'pao de acucar', 'dia %', 'hortifruti', 'sacolao']],
  ['Alimentação', ['ifood', 'rappi', 'restaur', 'lanch', 'padaria', 'pizza', 'burger', 'mcdonald', 'bk ', 'cafe', 'starbucks', 'acai', 'sorvet', 'subway', 'outback']],
  ['Transporte', ['uber', '99 ', '99app', 'posto', 'combust', 'shell', 'ipiranga', 'petrobras', 'metro', 'onibus', 'bilhete', 'cptm', 'sptrans', 'estaciona', 'pedagio']],
  ['Assinaturas', ['netflix', 'spotify', 'prime video', 'amazon prime', 'disney', 'youtube', 'apple.com', 'icloud', 'hbo', 'max ', 'deezer', 'crunchyroll', 'google one', 'claude', 'chatgpt']],
  ['Compras', ['shopee', 'mercadolivre', 'mercado livre', 'amazon', 'aliexpress', 'shein', 'magalu', 'americanas', 'renner', 'riachuelo', 'c&a']],
  ['Saúde', ['farmac', 'drogasil', 'droga raia', 'drogaria', 'pague menos', 'hospital', 'clinica', 'laborat', 'dentista']],
  ['Moradia', ['aluguel', 'condominio', 'iptu']],
  ['Contas da casa', ['enel', 'sabesp', 'energia', 'luz ', 'agua', 'internet', 'vivo', 'claro', 'tim ', 'oi ', 'gas ', 'comgas']],
  ['Educação', ['escola', 'faculdade', 'curso', 'udemy', 'alura', 'livraria', 'etec', 'univesp']],
  ['Lazer', ['cinema', 'ingresso', 'show', 'sympla', 'eventim', 'steam', 'playstation', 'xbox', 'nintendo']],
  ['Salário', ['salario', 'pagamento de salario', 'folha', 'proventos']],
  ['CEG recebido', ['pix recebido ceg']],
];
export function guessCategory(desc, type, categories) {
  const d = ' ' + norm(desc) + ' ';
  const list = categories.filter((c) => c.type === type);
  for (const [name, keys] of RULES) {
    if (keys.some((k) => d.includes(k))) {
      const c = list.find((x) => norm(x.name) === norm(name));
      if (c) return c.id;
    }
  }
  const fallback = list.find((c) => /^outr/.test(norm(c.name))) || list[list.length - 1];
  return fallback?.id || '';
}
