import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, updateProfile 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  setDoc, doc, updateDoc, getDoc, deleteDoc 
} from "firebase/firestore";
import './index.css';
import { Icon } from "@iconify/react";

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// FIREBASE CONFIG
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

const tData = {
  uz: { search: "Qidirish...", night: "Tungi rejim", lang: "Til", logout: "Chiqish", save: "O'zgartirish", start: "Suhbatni boshlang", global: "Global Guruh", edit: "Tahrirlash", delete: "O'chirish" },
  ru: { search: "Поиск...", night: "Ночной режим", lang: "Язык", logout: "Выйти", save: "Изменить", start: "Выберите чат", global: "Общий чат", edit: "Изменить", delete: "Удалить" },
  en: { search: "Search...", night: "Night Mode", lang: "Language", logout: "Logout", save: "Edit Profile", start: "Select a chat", global: "Global Group", edit: "Edit", delete: "Delete" }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState('uz');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMsg, setEditMsg] = useState(null);
  
  const scrollRef = useRef();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const qUsers = query(collection(db, "users"));
        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
          const list = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(u => u.id !== currentUser.uid);
          setUsers(list);
        });
        return () => unsubUsers();
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!selected || !user) return;
    
    let qMsgs;
    if (selected.id === 'global_chat') {
      qMsgs = query(collection(db, "global_messages"), orderBy("createdAt", "asc"));
    } else {
      const combinedId = [user.uid, selected.id].sort().join("_");
      qMsgs = query(collection(db, "chats", combinedId, "messages"), orderBy("createdAt", "asc"));
    }

    return onSnapshot(qMsgs, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [selected, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onDelete = async (msgId) => {
    if (!window.confirm("Xabarni o'chirmoqchimisiz?")) return;
    try {
      if (selected.id === 'global_chat') {
        await deleteDoc(doc(db, "global_messages", msgId));
      } else {
        const combinedId = [user.uid, selected.id].sort().join("_");
        await deleteDoc(doc(db, "chats", combinedId, "messages", msgId));
      }
      toast.info("Xabar o'chirildi");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;

    try {
      if (editMsg) {
        let docRef;
        if (selected.id === 'global_chat') {
          docRef = doc(db, "global_messages", editMsg.id);
        } else {
          const combinedId = [user.uid, selected.id].sort().join("_");
          docRef = doc(db, "chats", combinedId, "messages", editMsg.id);
        }
        await updateDoc(docRef, { text: text, isEdited: true });
        setEditMsg(null);
      } else {
        const msgData = {
          text,
          senderId: user.uid,
          senderName: user.displayName || user.email.split('@')[0],
          createdAt: serverTimestamp(),
        };

        if (selected.id === 'global_chat') {
          await addDoc(collection(db, "global_messages"), msgData);
        } else {
          const combinedId = [user.uid, selected.id].sort().join("_");
          const chatRef = doc(db, "chats", combinedId);
          
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              members: [user.uid, selected.id],
              lastMessage: text,
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(chatRef, {
              lastMessage: text,
              updatedAt: serverTimestamp(),
            });
          }
          await addDoc(collection(chatRef, "messages"), msgData);
        }
      }
      setText("");
    } catch (err) {
      toast.error("Xato: " + err.message);
    }
  };

  if (!user) return <AuthUI auth={auth} db={db} />;
  const t = tData[lang];

  return (
    <div className={`app-container ${!isDark ? 'light-mode' : ''}`} style={{ 
      '--list-view': selected ? 'none' : 'flex', 
      '--chat-view': selected ? 'flex' : 'none'
    }}>

      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="avatar" style={{width:60, height:60, fontSize:22}}>
            {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <div style={{marginTop:15, fontWeight:'700', fontSize:18, color:'var(--text)'}}>
            {user.displayName || user.email.split('@')[0]}
          </div>
          <div style={{fontSize:13, color:'var(--text-dim)'}}>{user.email}</div>
        </div>
        <div style={{padding: '10px 0'}}>
          <div className="drawer-item" onClick={() => setIsDark(!isDark)}>
            <Icon icon={isDark ? "solar:sun-linear" : "solar:moon-linear"} width="24" /> 
            <span>{t.night}</span>
          </div>
          <div className="drawer-item" onClick={() => setLang(lang === 'uz' ? 'ru' : lang === 'ru' ? 'en' : 'uz')}>
            <Icon icon="subway:world-1" width="24" /> 
            <span>{t.lang}: {lang.toUpperCase()}</span>
          </div>
          <div className="drawer-item" onClick={() => { signOut(auth); toast.info("Chiqildi"); }} style={{color:'#ff4d4d'}}>
            <Icon icon="ci:exit" width="24" /> 
            <span>{t.logout}</span>
          </div>
        </div>
      </div>

      <div className="nav-rail">
        <div className="nav-btn" onClick={() => setDrawerOpen(true)}><Icon icon="solar:hamburger-menu-linear" width="26" /></div>
        <div className="nav-btn active"><Icon icon="solar:chat-round-line-linear" width="26" /></div>
        <div className="nav-btn" style={{marginTop:'auto'}} onClick={() => setIsDark(!isDark)}>
            <Icon icon={isDark ? "solar:sun-linear" : "solar:moon-linear"} width="26" />
        </div>
      </div>

      <div className="sidebar">
        <div className="mobile-top-bar">
          <Icon icon="solar:hamburger-menu-linear" width="24" onClick={() => setDrawerOpen(true)} />
          <b style={{marginLeft: 15}}>Webgram</b>
        </div>
        <div className="search-area">
          <input className="search-input" placeholder={t.search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chat-list">
          <div className={`chat-card ${selected?.id === 'global_chat' ? 'active' : ''}`} 
               onClick={() => setSelected({ id: 'global_chat', displayName: t.global })}>
            <div className="avatar" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
              <Icon icon="solar:global-linear" width="24" />
            </div>
            <div style={{flex:1}}>
              <b className="user-name-list">{t.global}</b>
              <div style={{fontSize:'12px', opacity:0.6}}>Hamma foydalanuvchilar</div>
            </div>
          </div>
          
          <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'10px 20px'}} />

          {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase()))).map(u => (
            <div key={u.id} className={`chat-card ${selected?.id === u.id ? 'active' : ''}`} onClick={() => setSelected(u)}>
              <div className="avatar">{u.displayName ? u.displayName[0].toUpperCase() : u.email[0].toUpperCase()}</div>
              <div style={{flex:1, overflow:'hidden'}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <b className="user-name-list">{u.displayName || u.email.split('@')[0]}</b>
                  <small style={{opacity:0.5}}>bugun</small>
                </div>
                <div style={{fontSize:'13px', opacity:0.6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {u.lastMessage || "Suhbatni boshlash..."}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-surface">
        {selected ? (
          <>
            <div className="header-bar">
              <div className="header-left">
                <div className="back-btn" onClick={() => setSelected(null)}>
                    <Icon icon="solar:alt-arrow-left-linear" width="28" />
                </div>
                <div className="avatar">
                    {selected.id === 'global_chat' ? <Icon icon="solar:global-linear" /> : (selected.displayName ? selected.displayName[0].toUpperCase() : selected.email[0].toUpperCase())}
                </div>
                <div className="header-info">
                  <div className="user-name">{selected.displayName}</div>
                  <div className="user-status">{selected.id === 'global_chat' ? 'Ommaviy guruh' : 'online'}</div>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-premium" onClick={async () => {
                  const n = prompt("Ismingizni yangilang:");
                  if(n) {
                    await updateDoc(doc(db, "users", auth.currentUser.uid), { displayName: n });
                    toast.success("Yangilandi!");
                  }
                }}>{t.save}</button>
              </div>
            </div>

            <div className="messages-box">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.senderId === user.uid ? 'sent' : 'received'}`}>
                  {selected.id === 'global_chat' && m.senderId !== user.uid && (
                    <div style={{fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '3px'}}>
                      {m.senderName}
                    </div>
                  )}
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span>{m.text}</span>
                    {m.senderId === user.uid && (
                      <div className="msg-actions" style={{display:'flex', gap: '5px', marginLeft: '10px', opacity: 0.5}}>
                        <Icon icon="solar:pen-linear" onClick={() => { setEditMsg(m); setText(m.text); }} style={{cursor:'pointer'}} width="14" />
                        <Icon icon="solar:trash-bin-minimalistic-linear" onClick={() => onDelete(m.id)} style={{cursor:'pointer'}} width="14" />
                      </div>
                    )}
                  </div>
                  {m.isEdited && <div style={{fontSize:'9px', opacity:0.5, textAlign:'right', marginTop:2}}>tahrirlandi</div>}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form className="input-container" onSubmit={onSend} style={{position:'relative'}}>
              {editMsg && (
                <div className="edit-panel" style={{position:'absolute', top: '-40px', left: 0, right: 0, background: 'var(--bg)', padding: '5px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop: '1px solid var(--border)', zIndex: 10}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Icon icon="solar:pen-linear" color="var(--accent)" />
                    <div style={{fontSize:'12px'}}>
                      <div style={{color:'var(--accent)', fontWeight:'bold'}}>{t.edit}</div>
                      <div style={{opacity:0.6}}>{editMsg.text.substring(0, 20)}...</div>
                    </div>
                  </div>
                  <Icon icon="ic:round-close" onClick={() => {setEditMsg(null); setText("");}} style={{cursor:'pointer'}} />
                </div>
              )}
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Xabar yozing..." />
              <button type="submit" className="send-btn">
                <Icon icon={editMsg ? "solar:check-read-bold" : "solar:plain-2-bold"} width="24" />
              </button>
            </form>
          </>
        ) : (
          <div style={{margin:'auto', opacity:0.3, textAlign:'center'}}>
            <Icon icon="solar:chat-round-dots-linear" width="80" />
            <p style={{fontSize:18, marginTop:10}}>{t.start}</p>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-center" theme={isDark ? "dark" : "light"} />
    </div>
  );
}

function AuthUI({auth, db}) {
  const [isLog, setIsLog] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (isLog) {
        await signInWithEmailAndPassword(auth, email, pass);
        toast.success("Xush kelibsiz!");
      } else {
        const r = await createUserWithEmailAndPassword(auth, email, pass);
        // DisplayName'ni Auth tizimida yangilash
        await updateProfile(r.user, { 
          displayName: name || email.split('@')[0] 
        });
        // Firestore'ga foydalanuvchi ma'lumotlarini qo'shish
        await setDoc(doc(db, "users", r.user.uid), { 
          email: email, 
          id: r.user.uid,
          displayName: name || email.split('@')[0],
          createdAt: serverTimestamp() 
        });
        toast.success("Ro'yxatdan o'tish yakunlandi!");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <Icon icon="logos:telegram" width="80" style={{marginBottom:20}} />
        <h2 style={{marginBottom:20}}>{isLog ? "Kirish" : "Ro'yxatdan o'tish"}</h2>
        <form onSubmit={handle}>
          {!isLog && <input className="auth-input" type="text" placeholder="Ismingiz" value={name} onChange={e => setName(e.target.value)} required />}
          <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Parol" value={pass} onChange={e => setPass(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Yuklanmoqda..." : (isLog ? "Kirish" : "Ro'yxatdan o'tish")}
          </button>
        </form>
        <p onClick={() => { setIsLog(!isLog); setName(""); }} style={{marginTop:20, color:'var(--accent)', cursor:'pointer'}}>
          {isLog ? "Hisob ochish" : "Kirishga qaytish"}
        </p>
      </div>
    </div>
  );
}