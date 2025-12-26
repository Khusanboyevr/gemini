import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import './index.css';
import { Icon } from "@iconify/react";


const firebaseConfig = {
  apiKey: "AIzaSyAjS9rgXTe55XVXCoFfbTPFtg3P0K9dfQs",
  authDomain: "telegram-d19cf.firebaseapp.com",
  projectId: "telegram-d19cf",
  storageBucket: "telegram-d19cf.firebasestorage.app",
  messagingSenderId: "683725661716",
  appId: "1:683725661716:web:4e6a5703f0ca0de63ee901"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const translation = {
  uz: { search: "Qidirish...", group: "Yangi guruh", contacts: "Kontaktlar", night: "Tungi rejim", logout: "Chiqish", save: "Saqlash", send: "Yuborish" },
  ru: { search: "Поиск...", group: "Создать группу", contacts: "Контакты", night: "Ночной режим", logout: "Выйти", save: "Сохранить", send: "Отправить" },
  en: { search: "Search...", group: "New Group", contacts: "Contacts", night: "Night Mode", logout: "Logout", save: "Save", send: "Send" },
  tr: { search: "Ara...", group: "Yeni Grup", contacts: "Kişiler", night: "Gece Modu", logout: "Çıkış", save: "Kaydet", send: "Gönder" }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('uz');
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal'); // personal | groups
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadUsers(u.uid);
    });
  }, []);

  const loadUsers = async (myId) => {
    const q = query(collection(db, "users"));
    const snap = await getDocs(q);
    setUsers(snap.docs.filter(d => d.id !== myId).map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (!selected || !user) return;
    const cid = [user.uid, selected.id].sort().join("_");
    const q = query(collection(db, "chats", cid, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (s) => setMessages(s.docs.map(d => d.data())));
  }, [selected]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const cid = [user.uid, selected.id].sort().join("_");
    await addDoc(collection(db, "chats", cid, "messages"), {
      text: inputText, senderId: user.uid, createdAt: serverTimestamp()
    });
    setInputText("");
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) return <AuthUI auth={auth} db={db} />;

  const t = translation[lang];

  return (
    <div className={`app-container ${!darkMode ? 'light-mode' : ''}`}>
      
      {/* 1. NAVIGATION RAIL */}
      <div className="nav-rail">
        <div className="nav-btn" onClick={() => setMenuOpen(true)}>☰</div>
        <div className={`nav-btn ${currentTab === 'personal' ? 'active' : ''}`} onClick={() => setCurrentTab('personal')}><Icon icon="mingcute:user-4-fill" width="24" height="24" /></div>
        <div className={`nav-btn ${currentTab === 'groups' ? 'active' : ''}`} onClick={() => setCurrentTab('groups')}><Icon icon="mingcute:group-fill" width="24" height="24" /></div>
        <div style={{marginTop: 'auto'}} className="nav-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '🌙' : '☀️'}</div>
      </div>

      {/* 2. SIDEBAR CHATS */}
      <div className="sidebar-list">
        <div className="search-area">
          <input className="search-input" placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{overflowY: 'auto', flex: 1}}>
          {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
            <div key={u.id} className={`chat-card ${selected?.id === u.id ? 'active' : ''}`} onClick={() => setSelected(u)}>
              <div className="profile-avatar">{u.email[0].toUpperCase()}</div>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{fontWeight: '600'}}>{u.displayName || u.email.split('@')[0]}</span>
                  <small style={{opacity: 0.5}}>14:20</small>
                </div>
                <div style={{fontSize: 13, opacity: 0.6, marginTop: 4}}>Oxirgi xabar shu yerda...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN CHAT AREA */}
      <div className="chat-surface" onClick={() => setMenuOpen(false)}>
        <div className="chat-bg"></div>
        {selected ? (
          <>
            <div className="header-bar">
              <div style={{display:'flex', alignItems:'center', gap:15}}>
                <div className="profile-avatar" style={{width:40, height:40, fontSize:15}}>{selected.email[0].toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:'bold'}}>{selected.displayName || selected.email}</div>
                  <div style={{fontSize:12, color:'var(--accent-color)'}}>online</div>
                </div>
              </div>
              <button onClick={() => {
                const n = prompt("Ism:");
                if(n) updateDoc(doc(db, "users", selected.id), { displayName: n }).then(() => loadUsers(user.uid));
              }} style={{background:'none', border:'1px solid var(--border-color)', color:'var(--text-dim)', padding:'5px 15px', borderRadius:20, cursor:'pointer'}}>{t.save}</button>
            </div>
            
            <div className="messages-scroll">
              {messages.map((m, i) => (
                <div key={i} className={`msg-bubble ${m.senderId === user.uid ? 'sent' : 'received'}`}>
                  {m.text}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form className="action-bar" onSubmit={onSend}>
              <input value={inputText} onChange={e=>setInputText(e.target.value)} placeholder={t.write} />
              <button type="submit" style={{color:'var(--accent-color)', background:'none', border:'none', fontWeight:'bold', cursor:'pointer'}}>{t.send}</button>
            </form>
          </>
        ) : (
          <div style={{margin:'auto', background:'rgba(0,0,0,0.2)', padding:'10px 25px', borderRadius:30, backdropFilter:'blur(10px)'}}>Chat tanlang</div>
        )}
      </div>

      {/* DRAWER MENU */}
      <div className={`side-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-top" style={{padding:30}}>
          <div className="profile-avatar" style={{width:64, height:64, fontSize:24}}>{user.email[0].toUpperCase()}</div>
          <div style={{marginTop:15, fontWeight:'bold', fontSize:18}}>{user.displayName || user.email}</div>
        </div>
        <div className="drawer-item" onClick={() => {/* Guruh ochish */}}><Icon icon="mingcute:group-fill" width="24" height="24" /> {t.group}</div>
        <div className="drawer-item"><Icon icon="guidance:user-1" width="24" height="24" /> {t.contacts}</div>
        <div className="drawer-item" onClick={() => setLang(lang==='uz'?'ru':lang==='ru'?'en':'uz')}><Icon icon="tabler:world" width="24" height="24" /> Til: {lang.toUpperCase()}</div>
        <div className="drawer-item" onClick={() => signOut(auth)} style={{color:'#ff4d4d', marginTop:20}}><Icon icon="system-uicons:exit-left" width="24" height="24" /> {t.logout}</div>
      </div>
    </div>
  );
}

// Minimal Auth UI
function AuthUI({auth, db}) {
  const [isLog, setIsLog] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLog) await signInWithEmailAndPassword(auth, email, pass);
      else {
        const r = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", r.user.uid), { email, id: r.user.uid });
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
      <div style={{width:340, textAlign:'center'}}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="90" style={{marginBottom:30}} />
        <form onSubmit={submit}>
          <input type="email" placeholder="Email" style={{width:'100%', padding:12, marginBottom:10, border:'1px solid #ddd', borderRadius:10}} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Parol" style={{width:'100%', padding:12, marginBottom:15, border:'1px solid #ddd', borderRadius:10}} onChange={e=>setPass(e.target.value)} required />
          <button style={{width:'100%', padding:12, background:'#2481cc', color:'#fff', border:'none', borderRadius:10, fontWeight:'bold'}}>{isLog ? "Kirish" : "Ro'yxatdan o'tish"}</button>
        </form>
        <p onClick={()=>setIsLog(!isLog)} style={{marginTop:20, color:'#2481cc', cursor:'pointer'}}>{isLog ? "Hisob yaratish" : "Kirishga qaytish"}</p>
      </div>
    </div>
  );
}