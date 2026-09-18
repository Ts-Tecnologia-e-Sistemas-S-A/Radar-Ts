import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { hasVerifiedAccess, INITIAL_ADMIN_EMAIL, isInitialAdmin, normalizeEmail, type AccessRole, type AuthorizedUser } from './access';

const USERS = 'usuarios_autorizados';
type GateState = 'loading' | 'signed-out' | 'denied' | 'allowed' | 'error';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [managing, setManaging] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (current) => {
    setUser(current); setMessage(''); setManaging(false);
    if (!current) { setState('signed-out'); setAdmin(false); return; }
    try {
      const email = normalizeEmail(current.email || '');
      const snapshot = email ? await getDoc(doc(db, USERS, email)) : null;
      const record = snapshot?.exists() ? snapshot.data() as AuthorizedUser : null;
      if (!hasVerifiedAccess(email, current.emailVerified, record)) { setState('denied'); setAdmin(false); return; }
      const isAdmin = isInitialAdmin(email) || record?.perfil === 'admin';
      setAdmin(isAdmin); setState('allowed');
      if (isInitialAdmin(email) && !record) {
        const now = new Date().toISOString();
        await setDoc(doc(db, USERS, email), { email, perfil: 'admin', ativo: true, criadoEm: now, atualizadoEm: now, criadoPor: current.uid });
      }
    } catch (error) {
      console.error('Falha ao verificar autorização', error);
      setMessage('Não foi possível confirmar sua autorização. Tente novamente.'); setState('error');
    }
  }), []);

  async function login() {
    setState('loading'); setMessage('');
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (error: any) { setState('signed-out'); setMessage(error?.code === 'auth/popup-closed-by-user' ? 'Login cancelado.' : 'Não foi possível entrar com Google.'); }
  }

  if (state !== 'allowed' || !user) return <AccessScreen state={state} message={message} email={user?.email} onLogin={login} onLogout={() => signOut(auth)} />;
  return <>
    <div className="fixed right-3 top-3 z-[100] flex gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-lg border border-slate-200">
      <span className="max-w-44 truncate">{user.email}</span>
      {admin && <button className="font-semibold text-blue-700" onClick={() => setManaging(true)}>Usuários</button>}
      <button onClick={() => signOut(auth)}>Sair</button>
    </div>
    {children}
    {managing && <UsersPanel current={user} onClose={() => setManaging(false)} />}
  </>;
}

function AccessScreen({ state, message, email, onLogin, onLogout }: { state: GateState; message: string; email?: string | null; onLogin: () => void; onLogout: () => void }) {
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
    <h1 className="text-2xl font-bold text-slate-900">Radar TS</h1>
    {state === 'loading' && <p className="mt-4">Verificando acesso…</p>}
    {state === 'signed-out' && <><p className="my-4 text-slate-600">Entre com uma conta Google autorizada.</p><button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white" onClick={onLogin}>Entrar com Google</button></>}
    {(state === 'denied' || state === 'error') && <><p className="my-4 text-red-700">{message || `A conta ${email || ''} não está autorizada.`}</p><button className="rounded-lg border px-4 py-2" onClick={onLogout}>Usar outra conta</button></>}
    {message && state === 'signed-out' && <p className="mt-3 text-sm text-red-700">{message}</p>}
  </section></main>;
}

function UsersPanel({ current, onClose }: { current: User; onClose: () => void }) {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('usuario');
  const [message, setMessage] = useState('Carregando…');
  const load = async () => {
    try { const snapshot = await getDocs(collection(db, USERS)); setUsers(snapshot.docs.map(item => item.data() as AuthorizedUser).sort((a, b) => a.email.localeCompare(b.email))); setMessage(''); }
    catch { setMessage('Não foi possível carregar os usuários.'); }
  };
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); const normalized = normalizeEmail(email);
    if (!/^\S+@\S+\.\S+$/.test(normalized)) { setMessage('Informe um e-mail válido.'); return; }
    const now = new Date().toISOString();
    try { await setDoc(doc(db, USERS, normalized), { email: normalized, perfil: role, ativo: true, atualizadoEm: now, criadoEm: now, criadoPor: current.uid }, { merge: true }); setEmail(''); await load(); }
    catch { setMessage('Não foi possível salvar o usuário.'); }
  }
  async function toggle(item: AuthorizedUser) {
    if (isInitialAdmin(item.email)) return;
    try { await setDoc(doc(db, USERS, item.email), { ativo: !item.ativo, atualizadoEm: new Date().toISOString() }, { merge: true }); await load(); }
    catch { setMessage('Não foi possível alterar o acesso.'); }
  }
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/40 p-4"><section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
    <div className="flex justify-between"><h2 className="text-xl font-bold">Usuários autorizados</h2><button onClick={onClose}>Fechar</button></div>
    <form className="my-5 flex flex-wrap gap-2" onSubmit={save}><input aria-label="E-mail" className="min-w-56 flex-1 rounded border p-2" placeholder="email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} /><select aria-label="Perfil" className="rounded border p-2" value={role} onChange={e => setRole(e.target.value as AccessRole)}><option value="usuario">Usuário</option><option value="admin">Administrador</option></select><button className="rounded bg-blue-700 px-4 text-white">Adicionar</button></form>
    {message && <p className="text-sm text-slate-600">{message}</p>}
    <div className="max-h-72 overflow-auto">{users.map(item => <div key={item.email} className="flex items-center justify-between border-t py-3"><div><strong>{item.email}</strong><p className="text-xs">{item.perfil} · {item.ativo ? 'ativo' : 'inativo'}</p></div><button disabled={isInitialAdmin(item.email)} className="rounded border px-3 py-1 disabled:opacity-50" onClick={() => void toggle(item)}>{item.ativo ? 'Desativar' : 'Ativar'}</button></div>)}</div>
  </section></div>;
}
