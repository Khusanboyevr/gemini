
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { auth, db } from './lib/firebase';
import { translations } from './lib/translations';

import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Settings
  const [lang, setLang] = useState(localStorage.getItem('gemini_lang') || 'uz');
  const [theme, setTheme] = useState(localStorage.getItem('gemini_theme') || 'dark');
  const [contacts, setContacts] = useState({});

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('gemini_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('gemini_theme', theme);
    document.body.className = theme === 'light' ? 'light-mode' : '';
  }, [theme]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);



  // Load Contacts
  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().contacts) {
        // Check if it's legacy array or new object
        const data = snap.data().contacts;
        if (Array.isArray(data)) {
          // Convert legacy array to object
          const newMap = {};
          data.forEach(id => newMap[id] = ""); // Default name empty
          setContacts(newMap);
        } else {
          setContacts(data);
        }
      }
    };
    loadContacts();
  }, [user]);

  // Responsive Mobile Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for Users
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.id !== user.uid);
      setUsers(list);
    });
    return () => unsub();
  }, [user]);

  const saveContact = async (uid, nickname) => {
    if (!user) return;
    const newContacts = { ...contacts, [uid]: nickname };
    setContacts(newContacts);
    await updateDoc(doc(db, "users", user.uid), { contacts: newContacts });
  };

  const removeContact = async (uid) => {
    if (!user) return;
    const newContacts = { ...contacts };
    delete newContacts[uid];
    setContacts(newContacts);
    await updateDoc(doc(db, "users", user.uid), { contacts: newContacts });
  };

  const t = translations[lang];

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Auth auth={auth} db={db} />;

  return (
    <div className="app-layout">
      {/* Drawer Overlay for Mobile */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* Main Grid */}
      <Sidebar
        currentUser={user}
        users={users}
        selected={selected}
        setSelected={setSelected}
        isMobile={isMobile}
        setDrawerOpen={setDrawerOpen}
        lang={lang} setLang={setLang}
        theme={theme} setTheme={setTheme}
        t={t}
        contacts={contacts}
        saveContact={saveContact}
      />

      <ChatWindow
        db={db}
        currentUser={user}
        selected={selected}
        setSelected={setSelected}
        isMobile={isMobile}
        t={t}
        contacts={contacts}
        saveContact={saveContact}
        removeContact={removeContact}
      />

      <ToastContainer position="bottom-right" theme={theme} />
    </div>
  );
}