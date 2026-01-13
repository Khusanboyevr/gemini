
import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Sidebar({ currentUser, users, selected, setSelected, isMobile, setDrawerOpen, lang, setLang, theme, setTheme, t, contacts }) {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [showSettings, setShowSettings] = useState(false);

    const filteredUsers = users.filter(u => {
        const rawName = u.displayName || u.email.split('@')[0];
        const contactName = contacts[u.id] || rawName;
        const matchesSearch = contactName.toLowerCase().includes(search.toLowerCase());
        const isContact = contacts.hasOwnProperty(u.id);

        if (tab === 'contacts') return matchesSearch && isContact;
        return matchesSearch;
    });

    const languages = [
        { code: 'uz', name: "O'zbek", icon: "emojione:flag-for-uzbekistan" },
        { code: 'en', name: "English", icon: "emojione:flag-for-united-kingdom" },
        { code: 'ru', name: "Русский", icon: "emojione:flag-for-russia" },
        { code: 'tr', name: "Türkçe", icon: "emojione:flag-for-turkey" },
        { code: 'ar', name: "العربية", icon: "emojione:flag-for-saudi-arabia" },
    ];

    const renderSettings = () => (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--bg-secondary)', zIndex: 50,
            transform: showSettings ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '20px', display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.settings}</h2>
                <Icon icon="solar:close-circle-linear" width="32" onClick={() => setShowSettings(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div className="glass-card" style={{ padding: '15px', marginBottom: '15px' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>{t.theme}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn"
                        style={{ flex: 1, background: theme === 'dark' ? 'var(--accent-gradient)' : 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        onClick={() => setTheme('dark')}
                    >
                        <Icon icon="solar:moon-linear" style={{ marginRight: '5px' }} /> {t.dark}
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, background: theme === 'light' ? 'var(--accent-gradient)' : 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        onClick={() => setTheme('light')}
                    >
                        <Icon icon="solar:sun-linear" style={{ marginRight: '5px' }} /> {t.light}
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t.language}</div>
                {languages.map(l => (
                    <div key={l.code} onClick={() => setLang(l.code)} style={{
                        padding: '10px', borderRadius: '10px', cursor: 'pointer',
                        background: lang === l.code ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        border: lang === l.code ? '1px solid var(--accent-color)' : '1px solid transparent',
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <Icon icon={l.icon} width="24" />
                        <span>{l.name}</span>
                    </div>
                ))}
            </div>

            <button className="btn" style={{ width: '100%', background: '#ef4444', marginTop: 'auto' }} onClick={() => signOut(auth)}>
                <Icon icon="solar:logout-2-linear" width="20" style={{ marginRight: '8px' }} />
                {t.logout}
            </button>
        </div>
    );

    return (
        <div className={`sidebar ${isMobile ? (selected ? 'hidden' : 'flex') : 'flex'}`} style={{
            width: isMobile ? '100%' : '380px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--glass-border)',
            display: 'flex',
            height: '100%', position: 'relative',
            overflow: 'hidden'
        }}>

            {/* LEFT RAIL */}
            <div style={{
                width: '60px', height: '100%', background: 'rgba(0,0,0,0.2)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px'
            }}>
                <div onClick={() => setShowSettings(true)} style={{ cursor: 'pointer', padding: '10px', borderRadius: '12px', background: showSettings ? 'var(--accent-color)' : 'transparent', color: showSettings ? 'white' : 'var(--text-secondary)' }}>
                    <Icon icon="solar:hamburger-menu-linear" width="28" />
                </div>

                <div
                    onClick={() => { setTab('all'); setDrawerOpen && setDrawerOpen(false); }}
                    style={{
                        cursor: 'pointer', padding: '10px', borderRadius: '12px',
                        background: tab === 'all' ? 'var(--accent-gradient)' : 'transparent',
                        color: tab === 'all' ? 'white' : 'var(--text-secondary)'
                    }}
                    title={t.all_users}
                >
                    <Icon icon="solar:users-group-rounded-linear" width="26" />
                </div>

                <div
                    onClick={() => { setTab('contacts'); setDrawerOpen && setDrawerOpen(false); }}
                    style={{
                        cursor: 'pointer', padding: '10px', borderRadius: '12px',
                        background: tab === 'contacts' ? 'var(--accent-gradient)' : 'transparent',
                        color: tab === 'contacts' ? 'white' : 'var(--text-secondary)'
                    }}
                    title={t.contacts}
                >
                    <Icon icon="solar:book-bookmark-linear" width="26" />
                </div>

                <div style={{ marginTop: 'auto' }} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    <Icon icon={theme === 'dark' ? "solar:sun-linear" : "solar:moon-linear"} width="24" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
                </div>
            </div>

            {/* LIST CONTENT */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {renderSettings()}

                <h2 style={{ padding: '20px 20px 10px 20px', fontSize: '20px', fontWeight: '800' }}>
                    {tab === 'contacts' ? t.contacts : t.all_users}
                </h2>

                {/* Search */}
                <div style={{ padding: '0 20px 15px 20px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="input-field"
                            placeholder={t.search}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '40px', background: 'var(--bg-primary)', fontSize: '14px', padding: '10px 40px' }}
                        />
                        <Icon icon="solar:magnifer-linear" width="18" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                </div>

                {/* User List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>

                    {/* Global Chat Item (Only on All Users) */}
                    {tab === 'all' && (
                        <div
                            onClick={() => setSelected({ id: 'global_chat', displayName: t.global })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                background: selected?.id === 'global_chat' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                transition: 'var(--transition)', marginBottom: '5px'
                            }}
                        >
                            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                <Icon icon="solar:global-linear" width="22" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '15px' }}>{t.global}</div>
                            </div>
                        </div>
                    )}

                    {
                        tab === 'all' &&
                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '5px 10px' }}></div>
                    }

                    {filteredUsers.map(u => {
                        const nickname = contacts[u.id] || u.displayName || u.email.split('@')[0];

                        return (
                            <div
                                key={u.id}
                                onClick={() => setSelected({ ...u, displayName: nickname })} // Pass the nickname as display name for chat window
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    background: selected?.id === u.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <div style={{
                                    width: '45px', height: '45px', borderRadius: '12px',
                                    background: 'var(--accent-gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0
                                }}>
                                    {nickname ? nickname[0].toUpperCase() : u.email[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{nickname}</div>
                                        {contacts.hasOwnProperty(u.id) && <Icon icon="solar:star-bold" color="#f59e0b" width="12" />}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {u.lastMessage || '...'}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {filteredUsers.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>
                            No users found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
