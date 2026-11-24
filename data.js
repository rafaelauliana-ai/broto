// Camada de dados do Broto: Firebase (Auth + Firestore) ou modo demonstração (localStorage).
import { firebaseConfig } from './firebase-config.js';

export const DEMO = !firebaseConfig?.apiKey || /COLE|SUA_/i.test(firebaseConfig.apiKey);
export const COLS = ['accounts', 'transactions', 'categories', 'envelopes', 'cegs'];
export const db = { ready: false, profile: null, accounts: [], transactions: [], categories: [], envelopes: [], cegs: [] };

const V = '10.12.2';
const BASE = `https://www.gstatic.com/firebasejs/${V}/`;
let A = null, FS = null, auth = null, fs = null, uid = null;
let unsubs = [];
let onUserCb = null;
let pendingName = '';
const listeners = new Set();
export const onData = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((f) => f());
export let onError = (msg) => console.error(msg);
export const setErrorHandler = (fn) => (onError = fn);

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 20);

/* ---------------- dados iniciais ---------------- */
export const DEFAULT_CATEGORIES = [
  ['Alimentação', '🍔', '#FF8A65', 'expense'],
  ['Mercado', '🛒', '#FFB74D', 'expense'],
  ['Transporte', '🚌', '#4FC3F7', 'expense'],
  ['Moradia', '🏠', '#9575CD', 'expense'],
  ['Contas da casa', '💡', '#F6C343', 'expense'],
  ['Assinaturas', '📺', '#F06292', 'expense'],
  ['CEGs', '💿', '#BA68C8', 'expense'],
  ['Compras', '🛍️', '#4DB6AC', 'expense'],
  ['Saúde', '💊', '#E57373', 'expense'],
  ['Lazer', '🎉', '#81C784', 'expense'],
  ['Educação', '📚', '#7986CB', 'expense'],
  ['Outros gastos', '🌀', '#90A4AE', 'expense'],
  ['Salário', '💰', '#43A047', 'income'],
  ['Freela', '💻', '#26A69A', 'income'],
  ['Vendas', '🏷️', '#66BB6A', 'income'],
  ['CEG recebido', '💸', '#AB47BC', 'income'],
  ['Outras receitas', '✨', '#9CCC65', 'income'],
];
const DEFAULT_ACCOUNTS = [
  { name: 'Conta principal', type: 'corrente', initial: 0, color: '#2E9E5B', emoji: '🏦' },
  { name: 'Carteira', type: 'carteira', initial: 0, color: '#F5A524', emoji: '👛' },
];
function seedDocs(name) {
  const now = Date.now();
  return {
    profile: { name: name || '', createdAt: now, onboarded: false },
    categories: DEFAULT_CATEGORIES.map(([n, emoji, color, type], i) => ({ id: rid(), name: n, emoji, color, type, budget: 0, order: i, createdAt: now })),
    accounts: DEFAULT_ACCOUNTS.map((a, i) => ({ id: rid(), ...a, order: i, archived: false, createdAt: now })),
  };
}

/* ---------------- inicialização ---------------- */
export async function init(onUser) {
  onUserCb = onUser;
  if (DEMO) {
    const s = JSON.parse(localStorage.getItem('broto_demo_session') || 'null');
    setTimeout(() => onUser(s), 0);
    return;
  }
  const [appM, authM, fsM] = await Promise.all([
    import(BASE + 'firebase-app.js'),
    import(BASE + 'firebase-auth.js'),
    import(BASE + 'firebase-firestore.js'),
  ]);
  A = authM; FS = fsM;
  const app = appM.initializeApp(firebaseConfig);
  auth = A.getAuth(app);
  auth.languageCode = 'pt';
  try {
    fs = FS.initializeFirestore(app, { localCache: FS.persistentLocalCache({ tabManager: FS.persistentMultipleTabManager() }) });
  } catch (e) {
    fs = FS.getFirestore(app);
  }
  A.onAuthStateChanged(auth, (u) => onUser(u ? { uid: u.uid, email: u.email, name: u.displayName || pendingName || '' } : null));
}

/* ---------------- autenticação ---------------- */
export async function signUp(name, email, pass) {
  pendingName = name;
  if (DEMO) return demoLogin(email, name);
  const cred = await A.createUserWithEmailAndPassword(auth, email, pass);
  try { await A.updateProfile(cred.user, { displayName: name }); } catch (e) { /* não bloqueia */ }
}
export async function signIn(email, pass) {
  if (DEMO) return demoLogin(email, '');
  await A.signInWithEmailAndPassword(auth, email, pass);
}
export async function signInGoogle() {
  if (DEMO) return demoLogin('demo@broto.app', 'Demo');
  const provider = new A.GoogleAuthProvider();
  await A.signInWithPopup(auth, provider);
}
export async function resetPassword(email) {
  if (DEMO) return;
  await A.sendPasswordResetEmail(auth, email);
}
export async function signOut() {
  stop();
  if (DEMO) {
    localStorage.removeItem('broto_demo_session');
    onUserCb?.(null);
    return;
  }
  await A.signOut(auth);
}
function demoLogin(email, name) {
  const s = { uid: 'demo', email, name: name || email.split('@')[0] };
  localStorage.setItem('broto_demo_session', JSON.stringify(s));
  onUserCb?.(s);
}

export function authError(e) {
  const c = e?.code || '';
  const map = {
    'auth/invalid-email': 'Esse e-mail não parece válido.',
    'auth/missing-password': 'Digite sua senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não achei conta com esse e-mail.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouquinho e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.',
    'auth/operation-not-allowed': 'Esse tipo de login não está ativado no Firebase.',
    'auth/unauthorized-domain': 'Esse domínio não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).',
  };
  return map[c] || 'Algo deu errado. Tente de novo.';
}

/* ---------------- sincronização ---------------- */
export function stop() {
  unsubs.forEach((u) => u());
  unsubs = [];
  uid = null;
  Object.assign(db, { ready: false, profile: null, accounts: [], transactions: [], categories: [], envelopes: [], cegs: [] });
}

export async function start(user) {
  stop();
  uid = user.uid;
  if (DEMO) {
    const raw = JSON.parse(localStorage.getItem('broto_demo_db') || 'null');
    if (raw) Object.assign(db, raw);
    else {
      const s = seedDocs(user.name);
      Object.assign(db, s);
      demoSave();
    }
    db.ready = true;
    emit();
    return;
  }
  const pref = FS.doc(fs, 'users', uid);
  try {
    const snap = await FS.getDoc(pref);
    if (!snap.exists()) {
      const s = seedDocs(user.name || pendingName);
      const b = FS.writeBatch(fs);
      b.set(pref, s.profile);
      for (const c of s.categories) { const { id, ...d } = c; b.set(FS.doc(fs, 'users', uid, 'categories', id), d); }
      for (const a of s.accounts) { const { id, ...d } = a; b.set(FS.doc(fs, 'users', uid, 'accounts', id), d); }
      await b.commit();
    }
  } catch (e) {
    onError('Não consegui carregar seu perfil. Confira as regras do Firestore.');
    console.error(e);
  }
  const got = new Set();
  const check = (k) => { got.add(k); if (!db.ready && got.size === COLS.length + 1) { db.ready = true; } emit(); };
  unsubs.push(FS.onSnapshot(pref, (d) => { db.profile = d.data() || {}; check('profile'); }, (e) => onError('Erro ao sincronizar perfil.')));
  for (const col of COLS) {
    unsubs.push(FS.onSnapshot(FS.collection(fs, 'users', uid, col), (qs) => {
      db[col] = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      check(col);
    }, (e) => { console.error(e); onError('Erro ao sincronizar ' + col + '.'); }));
  }
}

function demoSave() {
  const { ready, ...rest } = db;
  localStorage.setItem('broto_demo_db', JSON.stringify(rest));
}

/* ---------------- operações ---------------- */
export function add(col, obj) {
  const id = obj.id || rid();
  const { id: _, ...data } = obj;
  const doc = { ...data, createdAt: data.createdAt || Date.now() };
  if (DEMO) { db[col].push({ id, ...doc }); demoSave(); emit(); return id; }
  FS.setDoc(FS.doc(fs, 'users', uid, col, id), doc).catch((e) => { console.error(e); onError('Não consegui salvar. Tente de novo.'); });
  return id;
}
export function addMany(col, arr) {
  if (!arr.length) return;
  if (DEMO) { for (const o of arr) { const { id, ...d } = o; db[col].push({ id: id || rid(), createdAt: Date.now(), ...d }); } demoSave(); emit(); return; }
  for (let i = 0; i < arr.length; i += 400) {
    const b = FS.writeBatch(fs);
    for (const o of arr.slice(i, i + 400)) {
      const { id, ...d } = o;
      b.set(FS.doc(fs, 'users', uid, col, id || rid()), { createdAt: Date.now(), ...d });
    }
    b.commit().catch((e) => { console.error(e); onError('Não consegui salvar tudo. Tente de novo.'); });
  }
}
export function update(col, id, patch) {
  if (DEMO) { const o = db[col].find((x) => x.id === id); if (o) Object.assign(o, patch); demoSave(); emit(); return; }
  FS.updateDoc(FS.doc(fs, 'users', uid, col, id), patch).catch((e) => { console.error(e); onError('Não consegui atualizar.'); });
}
export function remove(col, id) {
  if (DEMO) { db[col] = db[col].filter((x) => x.id !== id); demoSave(); emit(); return; }
  FS.deleteDoc(FS.doc(fs, 'users', uid, col, id)).catch((e) => { console.error(e); onError('Não consegui excluir.'); });
}
export function removeMany(col, ids) {
  if (!ids.length) return;
  if (DEMO) { const s = new Set(ids); db[col] = db[col].filter((x) => !s.has(x.id)); demoSave(); emit(); return; }
  for (let i = 0; i < ids.length; i += 400) {
    const b = FS.writeBatch(fs);
    for (const id of ids.slice(i, i + 400)) b.delete(FS.doc(fs, 'users', uid, col, id));
    b.commit().catch((e) => { console.error(e); onError('Não consegui excluir tudo.'); });
  }
}
export function updateProfile(patch) {
  if (DEMO) { db.profile = { ...(db.profile || {}), ...patch }; demoSave(); emit(); return; }
  FS.setDoc(FS.doc(fs, 'users', uid), patch, { merge: true }).catch((e) => { console.error(e); onError('Não consegui salvar o perfil.'); });
  if (patch.name && auth?.currentUser) A.updateProfile(auth.currentUser, { displayName: patch.name }).catch(() => {});
}
