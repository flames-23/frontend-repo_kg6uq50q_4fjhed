import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Home, Pill, Search, Settings as SettingsIcon, LogOut, Moon, Sun } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useLocalToken() {
  const [token, setToken] = useState(() => localStorage.getItem('mf_token') || '')
  const save = (t) => { setToken(t); if (t) localStorage.setItem('mf_token', t); else localStorage.removeItem('mf_token') }
  return { token, setToken: save }
}

function fmtTimeTo12h(t) {
  // normalize input to 12h like 08:30 PM
  try {
    const [raw, suffixRaw] = t.trim().split(/\s+/)
    let [hh, mm] = raw.split(':').map(Number)
    let suffix = suffixRaw ? suffixRaw.toUpperCase() : (hh >= 12 ? 'PM' : 'AM')
    if (hh === 0) { hh = 12; suffix = 'AM' }
    else if (hh === 12) { suffix = 'PM' }
    else if (hh > 12) { hh -= 12; suffix = 'PM' }
    return `${String(hh).padStart(2,'0')}:${String(mm||0).padStart(2,'0')} ${suffix}`
  } catch { return t }
}

function Nav({onLogout}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur border-t border-blue-100 md:static md:bg-transparent md:border-none">
      <div className="max-w-4xl mx-auto grid grid-cols-5 md:flex md:gap-6 p-2">
        <Link to="/" className="flex flex-col items-center text-sky-700 hover:text-sky-900"><Home size={20}/> <span className="text-xs">Home</span></Link>
        <Link to="/meds" className="flex flex-col items-center text-sky-700 hover:text-sky-900"><Pill size={20}/> <span className="text-xs">My Medicines</span></Link>
        <Link to="/search" className="flex flex-col items-center text-sky-700 hover:text-sky-900"><Search size={20}/> <span className="text-xs">Drug Info</span></Link>
        <Link to="/settings" className="flex flex-col items-center text-sky-700 hover:text-sky-900"><SettingsIcon size={20}/> <span className="text-xs">Settings</span></Link>
        <button onClick={onLogout} className="flex flex-col items-center text-rose-600 hover:text-rose-800"><LogOut size={20}/> <span className="text-xs">Logout</span></button>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <div className="relative h-[260px] md:h-[340px] w-full overflow-hidden rounded-b-3xl">
      <Spline scene="https://prod.spline.design/5EwoDiC2tChvmy4K/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
      <div className="absolute inset-0 flex items-end p-6">
        <div className="bg-white/70 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-semibold text-sky-900">Medi-Friend</h1>
          <p className="text-sky-700">Smart pill reminders aligned to India time</p>
        </div>
      </div>
    </div>
  )
}

function Auth({onAuthed}) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const forgot = async () => {
    setLoading(true); setMsg('')
    const res = await fetch(`${API_BASE}/auth/forgot`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) })
    const data = await res.json(); setLoading(false)
    setMsg(data.reset_token ? `Reset token: ${data.reset_token}` : 'If the email exists, a reset link was generated.')
  }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    const path = mode==='signup' ? '/auth/signup' : '/auth/login'
    const payload = mode==='signup' ? {name, email, password} : {email, password}
    const res = await fetch(`${API_BASE}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    const data = await res.json(); setLoading(false)
    if (res.ok) onAuthed(data)
    else setMsg(data.detail || 'Error')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <Hero />
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow border border-sky-100">
          <div className="flex gap-3 mb-4">
            <button onClick={()=>setMode('login')} className={`px-3 py-1 rounded-full ${mode==='login'?'bg-sky-600 text-white':'bg-sky-100 text-sky-700'}`}>Login</button>
            <button onClick={()=>setMode('signup')} className={`px-3 py-1 rounded-full ${mode==='signup'?'bg-sky-600 text-white':'bg-sky-100 text-sky-700'}`}>Sign up</button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode==='signup' && (
              <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required/>
            )}
            <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
            <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
            <button disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded py-2">{loading? 'Please wait...' : (mode==='signup'?'Create account':'Login')}</button>
          </form>
          <div className="flex justify-between mt-3 text-sm">
            <button onClick={forgot} className="text-sky-700 hover:underline">Forgot password?</button>
            {msg && <span className="text-sky-800">{msg}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function requireNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission !== 'denied') return Notification.requestPermission()
  return Promise.resolve(Notification.permission)
}

function parse12hToLocalDate(time12h) {
  // returns next occurrence today or tomorrow in local time
  const [time, suffix] = time12h.split(' ')
  let [h, m] = time.split(':').map(Number)
  const pm = suffix.toUpperCase() === 'PM'
  if (h === 12) h = pm ? 12 : 0
  else if (pm) h += 12
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)
  if (d <= now) d.setDate(d.getDate() + 1)
  return d
}

function useReminderEngine(token, enabled) {
  const [due, setDue] = useState(null)

  useEffect(() => {
    if (!token) return
    let interval
    let meds = []
    let timer

    const fetchMeds = async () => {
      const res = await fetch(`${API_BASE}/medications`, { headers: { Authorization: `Bearer ${token}` }})
      meds = res.ok ? await res.json() : []
    }

    const check = async () => {
      if (!enabled) return
      if (!('Notification' in window)) return
      const now = new Date()
      for (const m of meds) {
        const next = parse12hToLocalDate(m.time_12h)
        const delta = next - now
        // Trigger when within 30s window if snooze not set or expired
        const snoozeUntil = m.snooze_until_utc ? new Date(m.snooze_until_utc) : null
        if ((!snoozeUntil || snoozeUntil <= now) && Math.abs(delta) < 30000) {
          setDue(m)
          if (Notification.permission === 'granted') {
            new Notification(`Time to take ${m.name}`, { body: m.dosage })
          }
        }
      }
    }

    const start = async () => {
      await fetchMeds()
      await requireNotificationPermission()
      interval = setInterval(check, 15000)
    }

    start()
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [token, enabled])

  return { due, clear: () => setDue(null) }
}

function Meds({token}) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name:'', dosage:'', time_12h:'08:00 AM', frequency:'daily', notes:'' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch(`${API_BASE}/medications`, { headers: { Authorization: `Bearer ${token}` }})
    const data = res.ok ? await res.json() : []
    setItems(data); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const save = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_BASE}/medications`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ name:'', dosage:'', time_12h:'08:00 AM', frequency:'daily', notes:'' }); load() }
  }

  const del = async (id) => {
    await fetch(`${API_BASE}/medications/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    load()
  }

  const markTaken = async (id) => {
    await fetch(`${API_BASE}/medications/${id}/taken`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
    load()
  }

  const snooze = async (id) => {
    await fetch(`${API_BASE}/medications/${id}/snooze`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
    load()
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <h2 className="text-xl font-semibold text-sky-900 mb-3">My Medicines</h2>
      <form onSubmit={save} className="grid md:grid-cols-5 gap-2 bg-white/80 border border-sky-100 rounded-xl p-3">
        <input className="border rounded px-2 py-2" placeholder="Name" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} required />
        <input className="border rounded px-2 py-2" placeholder="Dosage" value={form.dosage} onChange={e=>setForm(v=>({...v,dosage:e.target.value}))} required />
        <input className="border rounded px-2 py-2" placeholder="Time (e.g., 08:30 PM)" value={form.time_12h} onChange={e=>setForm(v=>({...v,time_12h:fmtTimeTo12h(e.target.value)}))} required />
        <select className="border rounded px-2 py-2" value={form.frequency} onChange={e=>setForm(v=>({...v,frequency:e.target.value}))}>
          <option value="daily">Daily</option>
          <option value="alternate">Alternate Days</option>
          <option value="weekly">Weekly</option>
        </select>
        <button className="bg-sky-600 text-white rounded px-3 py-2">Add</button>
      </form>

      <div className="mt-4 space-y-2">
        {loading ? <p>Loading...</p> : items.length===0 ? <p className="text-sky-700">No medicines yet. Add your first reminder.</p> : items.map(m => (
          <div key={m.id} className="bg-white/80 border border-sky-100 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-sky-900">{m.name} <span className="text-sky-600">• {m.dosage}</span></div>
              <div className="text-sky-700 text-sm">At {m.time_12h} • {m.frequency}</div>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button onClick={()=>markTaken(m.id)} className="px-3 py-1 rounded bg-emerald-600 text-white">Taken</button>
              <button onClick={()=>snooze(m.id)} className="px-3 py-1 rounded bg-amber-500 text-white">Snooze 10m</button>
              <button onClick={()=>del(m.id)} className="px-3 py-1 rounded bg-rose-600 text-white">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DrugInfo() {
  const [q, setQ] = useState('')
  const [resu, setRes] = useState(null)
  const search = async (e) => {
    e.preventDefault(); setRes(null)
    const res = await fetch(`${API_BASE}/drug-info?q=${encodeURIComponent(q)}`)
    const data = await res.json(); setRes(data)
  }
  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <h2 className="text-xl font-semibold text-sky-900 mb-3">Drug Info</h2>
      <form onSubmit={search} className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Search medicine name" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="bg-sky-600 text-white rounded px-3 py-2">Search</button>
      </form>
      {resu && (
        <div className="mt-4 bg-white/80 border border-sky-100 rounded-xl p-4 space-y-3">
          {resu.found ? (
            <>
              <div>
                <div className="font-semibold text-sky-900">Primary use</div>
                <p className="text-sky-700 whitespace-pre-wrap">{resu.purpose || '—'}</p>
              </div>
              <div>
                <div className="font-semibold text-sky-900">Common side effects</div>
                <p className="text-sky-700 whitespace-pre-wrap">{resu.side_effects || '—'}</p>
              </div>
              <div>
                <div className="font-semibold text-sky-900">Dosage</div>
                <p className="text-sky-700 whitespace-pre-wrap">{resu.dosage || '—'}</p>
              </div>
              <div className="text-xs text-sky-600">Source: {resu.source}</div>
            </>
          ) : (
            <div className="text-sky-700">No results found.</div>
          )}
        </div>
      )}
    </div>
  )
}

function Settings({token, user, setUser, globalEnabled, setGlobalEnabled}) {
  const toggle = async () => {
    const newVal = !globalEnabled
    setGlobalEnabled(newVal)
    if (token) {
      await fetch(`${API_BASE}/me/settings`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ notifications_enabled: newVal }) })
    }
  }
  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <h2 className="text-xl font-semibold text-sky-900 mb-3">Settings</h2>
      <div className="bg-white/80 border border-sky-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-sky-900">Notifications</div>
          <div className="text-sky-700 text-sm">Enable browser notifications and in-app alerts</div>
        </div>
        <button onClick={toggle} className={`px-3 py-1 rounded ${globalEnabled? 'bg-emerald-600':'bg-slate-400'} text-white`}>{globalEnabled? 'Enabled':'Disabled'}</button>
      </div>
    </div>
  )
}

function HomePage({user}) {
  return (
    <div className="min-h-[40vh]">
      <Hero />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-semibold text-sky-900">Welcome{user?`, ${user.name}`:''}</h2>
        <p className="text-sky-700 mt-2">Add your medicines, get reminders on India time, and quickly look up drug information.</p>
      </div>
    </div>
  )
}

function Layout({onLogout}) {
  const { token, setToken } = useLocalToken()
  const [user, setUser] = useState(null)
  const [enabled, setEnabled] = useState(true)
  const { due, clear } = useReminderEngine(token, enabled)

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return
      const res = await fetch(`${API_BASE}/me`, { headers:{ Authorization:`Bearer ${token}` } })
      if (res.ok) { const u = await res.json(); setUser(u); setEnabled(u.notifications_enabled) } else { setUser(null) }
    }
    fetchMe()
  }, [token])

  const logout = () => { setToken(''); setUser(null); onLogout && onLogout() }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-16">
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/meds" element={<Meds token={token} />} />
        <Route path="/search" element={<DrugInfo />} />
        <Route path="/settings" element={<Settings token={token} user={user} setUser={setUser} globalEnabled={enabled} setGlobalEnabled={setEnabled} />} />
      </Routes>
      <Nav onLogout={logout} />

      {due && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-sky-100">
            <div className="text-lg font-semibold text-sky-900">It's time to take your {due.name}</div>
            <div className="text-sky-700">{due.dosage}</div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-emerald-600 text-white rounded px-3 py-2" onClick={async()=>{await fetch(`${API_BASE}/medications/${due.id}/taken`, {method:'POST', headers:{Authorization:`Bearer ${token}`}}); clear();}}>Taken ✅</button>
              <button className="flex-1 bg-amber-500 text-white rounded px-3 py-2" onClick={async()=>{await fetch(`${API_BASE}/medications/${due.id}/snooze`, {method:'POST', headers:{Authorization:`Bearer ${token}`}}); clear();}}>Snooze 10 mins ⏰</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const { token, setToken } = useLocalToken()
  const [authed, setAuthed] = useState(!!token)
  useEffect(()=>{ setAuthed(!!token) }, [token])

  if (!authed) return <Auth onAuthed={(data)=>{ setToken(data.token); }} />
  return (
    <Layout onLogout={()=>setAuthed(false)} />
  )
}

export default App
