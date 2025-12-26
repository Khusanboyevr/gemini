import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  setDoc, doc, updateDoc, getDoc 
} from "firebase/firestore";
import './index.css';
import { Icon } from "@iconify/react";

// 🔹 Toast imports
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
  uz: { search: "Qidirish...", group: "Yangi guruh", night: "Tungi rejim", lang: "Til", logout: "Chiqish", save: "Saqlash", start: "Suhbatni boshlang" },
  ru: { search: "Поиск...", group: "Новая группа", night: "Ночной режим", lang: "Язык", logout: "Выйти", save: "Сохранить", start: "Выберите чат" },
  en: { search: "Search...", group: "New Group", night: "Night Mode", lang: "Language", logout: "Logout", save: "Save", start: "Select a chat" }
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
  
  const scrollRef = useRef();

  // AUTH & USERS
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

  // MESSAGES LISTENER
  useEffect(() => {
    if (!selected || !user) return;
    const combinedId = [user.uid, selected.id].sort().join("_");
    const qMsgs = query(collection(db, "chats", combinedId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(qMsgs, (snapshot) => {
      setMessages(snapshot.docs.map(d => d.data()));
    });
  }, [selected, user]);

  // SCROLL TO BOTTOM
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 FIXED onSend FUNCTION WITH TOAST
  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) {
      toast.warn("Xabar bo‘sh bo‘lishi mumkin emas!");
      return;
    }

    const combinedId = [user.uid, selected.id].sort().join("_");
    const chatRef = doc(db, "chats", combinedId);
    const chatSnap = await getDoc(chatRef);

    try {
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          members: [user.uid, selected.id],
          createdAt: serverTimestamp(),
          lastMessage: text,
          updatedAt: serverTimestamp(),
        });
        toast.success("Yangi chat yaratildi!");
      } else {
        await updateDoc(chatRef, {
          lastMessage: text,
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(collection(chatRef, "messages"), {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      setText("");
      toast.success("Xabar yuborildi!");
    } catch (err) {
      toast.error("Xabar yuborishda xatolik: " + err.message);
    }
  };

  if (!user) return <AuthUI auth={auth} db={db} />;

  const t = tData[lang];

  return (
    <div className={`app-container ${!isDark ? 'light-mode' : ''}`} style={{ 
      '--list-view': selected ? 'none' : 'flex', 
      '--chat-view': selected ? 'flex' : 'none'
    }}>
      
      {/* 0. SIDE DRAWER */}
      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="avatar" style={{width:64, height:64, fontSize:22}}>{user.email[0].toUpperCase()}</div>
          <div style={{marginTop:15, fontWeight:'700', fontSize:18}}>{user.displayName || user.email}</div>
          <div style={{fontSize:13, opacity:0.7}}>{user.email}</div>
        </div>
        <div style={{paddingTop:10}}>
          <div className="drawer-item" onClick={() => {}}>
            <Icon icon="ph:users-light" width="24" height="24" /> {t.group}
          </div>
          <div className="drawer-item" onClick={() => setIsDark(!isDark)}>
            <Icon icon={isDark ? "line-md:moon-to-sunny-outline-loop-transition" : "line-md:sunny-filled-loop-to-moon-filled-loop-transition"} width="24" height="24" /> {t.night}
          </div>
          <div className="drawer-item" onClick={() => setLang(lang === 'uz' ? 'ru' : lang === 'ru' ? 'en' : 'uz')}>
            <Icon icon="subway:world-1" width="24" height="24" /> {t.lang}: {lang.toUpperCase()}
          </div>
          <div className="drawer-item" onClick={() => { signOut(auth); toast.info("Chiqdingiz!"); }} style={{color:'#ff4d4d', marginTop:20}}>
            <Icon icon="ci:exit" width="24" height="24" /> {t.logout}
          </div>
        </div>
      </div>

      {/* 1. LEFT NAVIGATION RAIL */}
      <div className="nav-rail">
        <div className="nav-btn" onClick={() => setDrawerOpen(true)} style={{fontSize: 24}}>☰</div>
        <div className="nav-btn active"><Icon icon="lucide:user-round" width="24" height="24" /></div>
        <div className="nav-btn"><Icon icon="ph:users-light" width="24" height="24" /></div>
        <div className="nav-btn" onClick={() => { signOut(auth); toast.info("Chiqdingiz!"); }} style={{marginTop:'auto', color:'#ff4d4d'}}>
          <Icon icon="ci:exit" width="24" height="24" />
        </div>
      </div>

      {/* 2. SIDEBAR USERS */}
      <div className="sidebar">
        <div className="mobile-top-bar">
          <div onClick={() => setDrawerOpen(true)} style={{fontSize: 24, cursor: 'pointer', marginRight: 15}}>☰</div>
          <b style={{fontSize: 18}}>Webgramm</b>
        </div>

        <div className="search-area">
          <input className="search-input" placeholder={t.search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chat-list">
          {users.filter(u => u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
            <div key={u.id} className={`chat-card ${selected?.id === u.id ? 'active' : ''}`} onClick={() => setSelected(u)}>
              <div className="avatar">{u.email[0].toUpperCase()}</div>
              <div style={{flex:1, overflow:'hidden'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <b style={{fontSize:'15px', whiteSpace:'nowrap'}}>{u.displayName || u.email.split('@')[0]}</b>
                  <small style={{opacity:0.5}}>12:45</small>
                </div>
                <div style={{fontSize:'13px', opacity:0.6, marginTop:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  Tap to start chat
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CHAT INTERFACE */}
      <div className="chat-surface">
        {selected ? (
          <>
           <div className="header-bar">
  {/* Chap qism */}
  <div className="header-info">
    <div className="back-btn" onClick={() => setSelected(null)}>⬅</div>

    <div className="avatar">
      {selected.email[0].toUpperCase()}
    </div>

    <div className="user-info">
      <div className="user-name">{selected.displayName || selected.email}</div>
      <div className="user-status">online</div>
    </div>
  </div>

  {/* O‘ng qism */}
  <div className="header-actions">
    <button className="btn-premium" onClick={() => {
      const n = prompt("Edit name:");
      if(n) {
        updateDoc(doc(db, "users", selected.id), { displayName: n });
        toast.success("Ism yangilandi!");
      }
    }}>{t.save}</button>
  </div>
</div>


            <div className="messages-box">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.senderId === user.uid ? 'sent' : 'received'}`}>
                  {m.text}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form className="input-container" onSubmit={onSend}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message..." />
              <button type="submit" style={{color:'var(--accent)', background:'none', border:'none', fontWeight:'700', cursor:'pointer', fontSize:15}}>SEND</button>
            </form>
          </>
        ) : (
          <div style={{margin:'auto', opacity:0.3, textAlign:'center'}}>
              <div style={{fontSize:60}}>💬</div>
              <p style={{fontSize:18, marginTop:10}}>{t.start}</p>
          </div>
        )}
      </div>

      {/* 🔹 Toast container */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

function AuthUI({auth, db}) {
  const [isLog, setIsLog] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      if (isLog) {
        await signInWithEmailAndPassword(auth, email, pass);
        toast.success("Muvaffaqiyatli kirildi!");
      } else {
        const r = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", r.user.uid), { 
          email: email, 
          id: r.user.uid,
          createdAt: serverTimestamp() 
        });
        toast.success("Hisob yaratildi!");
      }
    } catch (e) { 
      toast.error("Xato: " + e.message); 
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="90" style={{marginBottom:30}} alt="TG" />
        <h2 style={{marginBottom:20}}>{isLog ? "Welcome Back" : "Create Account"}</h2>
        <form onSubmit={handle}>
          <input className="auth-input" type="email" placeholder="Email address" onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" onChange={e => setPass(e.target.value)} required />
          <button className="auth-btn" type="submit">{isLog ? "Log In" : "Sign Up"}</button>
        </form>
        <p onClick={() => setIsLog(!isLog)} style={{marginTop:25, color:'#2481cc', cursor:'pointer', fontWeight:500}}>
          {isLog ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </p>
      </div>
    </div>
  );
}
