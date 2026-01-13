
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Icon } from "@iconify/react";
import { toast } from 'react-toastify';

export default function ChatWindow({ db, currentUser, selected, setSelected, isMobile, t, contacts, saveContact, removeContact }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingMsg, setEditingMsg] = useState(null);
    const scrollRef = useRef();

    // Load Messages
    useEffect(() => {
        if (!selected || !currentUser) return;
        setLoading(true);

        let q;
        let combinedId = null;

        if (selected.id === 'global_chat') {
            q = query(collection(db, "global_messages"), orderBy("createdAt", "asc"));
        } else {
            combinedId = [currentUser.uid, selected.id].sort().join("_");
            q = query(collection(db, "chats", combinedId, "messages"), orderBy("createdAt", "asc"));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            if (error.code === 'failed-precondition') {
                console.warn("Index needed, check console");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selected, currentUser, db]);

    // Auto Scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            if (editingMsg) {
                // Handle Edit
                let docRef;
                if (selected.id === 'global_chat') {
                    docRef = doc(db, "global_messages", editingMsg.id);
                } else {
                    const combinedId = [currentUser.uid, selected.id].sort().join("_");
                    docRef = doc(db, "chats", combinedId, "messages", editingMsg.id);
                }

                // Optimistic clear
                const newText = text;
                setEditingMsg(null);
                setText("");

                await updateDoc(docRef, { text: newText, isEdited: true });
                // No toast
            } else {
                // Handle New Message
                const msgContent = text;
                setText("");

                if (selected.id === 'global_chat') {
                    await addDoc(collection(db, "global_messages"), {
                        text: msgContent,
                        senderId: currentUser.uid,
                        senderName: currentUser.displayName || "User",
                        createdAt: serverTimestamp()
                    });
                } else {
                    const combinedId = [currentUser.uid, selected.id].sort().join("_");
                    const chatDocRef = doc(db, "chats", combinedId);
                    const chatSnap = await getDoc(chatDocRef);

                    if (!chatSnap.exists()) {
                        await setDoc(chatDocRef, {
                            members: [currentUser.uid, selected.id],
                            lastMessage: msgContent,
                            updatedAt: serverTimestamp()
                        });
                    } else {
                        await updateDoc(chatDocRef, {
                            lastMessage: msgContent,
                            updatedAt: serverTimestamp()
                        });
                    }

                    await addDoc(collection(db, "chats", combinedId, "messages"), {
                        text: msgContent,
                        senderId: currentUser.uid,
                        createdAt: serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Error: " + err.message);
        }
    };

    const deleteMessage = async (msgId) => {
        if (!window.confirm("Delete message?")) return;
        try {
            if (selected.id === 'global_chat') {
                await deleteDoc(doc(db, "global_messages", msgId));
            } else {
                const combinedId = [currentUser.uid, selected.id].sort().join("_");
                await deleteDoc(doc(db, "chats", combinedId, "messages", msgId));
            }
            // No toast
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddContact = () => {
        const name = prompt("Enter a name for this contact:", selected.displayName || "Friend");
        if (name) {
            saveContact(selected.id, name);
            toast.success("Contact saved");
        }
    };

    if (!selected) return (
        <div className={`chat-surface ${isMobile ? 'hidden' : 'flex'}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', opacity: 0.5 }}>
            <Icon icon="solar:chat-round-dots-linear" width="80" />
            <p style={{ marginTop: 20, fontSize: 18 }}>Select a chat to start messaging</p>
        </div>
    );

    const isContact = contacts.hasOwnProperty(selected.id);

    return (
        <div className={`chat-surface ${isMobile ? 'flex' : 'flex'}`} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-primary)', position: 'relative', height: '100%'
        }}>

            {/* Header */}
            <div className="glass-card" style={{
                height: '80px', margin: '20px', display: 'flex', alignItems: 'center',
                padding: '0 25px', justifyContent: 'space-between', borderRadius: '20px',
                background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div onClick={() => setSelected(null)} style={{ cursor: 'pointer', display: isMobile ? 'block' : 'none' }}>
                        <Icon icon="solar:arrow-left-linear" width="24" />
                    </div>
                    <div className="avatar" style={{
                        width: '45px', height: '45px', borderRadius: '12px',
                        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                    }}>
                        {selected.id === 'global_chat' ? <Icon icon="solar:global-linear" /> : (selected.displayName ? selected.displayName[0] : selected.email[0]).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '16px' }}>{selected.displayName || selected.email}</div>
                        <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></span>
                            {t.online}
                        </div>
                    </div>
                </div>

                {selected.id !== 'global_chat' && (
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => isContact ? removeContact(selected.id) : handleAddContact()}>
                        {isContact ? t.remove_contact : t.add_contact}
                    </button>
                )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 25px' }}>
                {messages.map((m, i) => {
                    const isMe = m.senderId === currentUser.uid;
                    return (
                        <div key={m.id || i} style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: '15px'
                        }}>
                            {!isMe && selected.id === 'global_chat' && (
                                <span style={{ fontSize: '11px', color: 'var(--accent-color)', marginBottom: '4px', marginLeft: '4px' }}>
                                    {m.senderName}
                                </span>
                            )}
                            <div className="glass-card" style={{
                                padding: '12px 18px',
                                background: isMe ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                                color: isMe ? 'white' : 'var(--text-primary)',
                                border: isMe ? 'none' : '1px solid var(--glass-border)',
                                borderRadius: '18px',
                                borderBottomRightRadius: isMe ? '4px' : '18px',
                                borderBottomLeftRadius: isMe ? '18px' : '4px',
                                maxWidth: '70%',
                                boxShadow: 'var(--shadow-sm)',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column', gap: '5px'
                            }}>
                                <div>{m.text}</div>
                                {m.isEdited && <div style={{ fontSize: '10px', opacity: 0.6, alignSelf: 'flex-end' }}>edited</div>}

                                {isMe && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px', justifyContent: 'flex-end', opacity: 0.7 }}>
                                        <Icon icon="solar:pen-linear" width="14" style={{ cursor: 'pointer' }} onClick={() => { setEditingMsg(m); setText(m.text); }} />
                                        <Icon icon="solar:trash-bin-minimalistic-linear" width="14" style={{ cursor: 'pointer' }} onClick={() => deleteMessage(m.id)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '20px' }}>
                <form onSubmit={handleSend} style={{
                    background: 'var(--bg-secondary)', padding: '10px',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)',
                    position: 'relative'
                }}>
                    {editingMsg && (
                        <div style={{ position: 'absolute', top: -40, left: 20, background: 'var(--bg-tertiary)', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>Editing...</span>
                            <Icon icon="solar:close-circle-linear" onClick={() => { setEditingMsg(null); setText(""); }} style={{ cursor: 'pointer' }} />
                        </div>
                    )}
                    <input
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            padding: '10px 15px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px'
                        }}
                        placeholder={t.type}
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />
                    <button type="submit" className="btn" style={{
                        width: '45px', height: '45px', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                    }}>
                        <Icon icon={editingMsg ? "solar:check-read-bold" : "solar:plain-3-bold"} width="24" />
                    </button>
                </form>
            </div>
        </div>
    );
}
