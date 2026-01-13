

import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { googleProvider, githubProvider } from "../lib/firebase";
import { Icon } from "@iconify/react";
import { toast } from 'react-toastify';

export default function Auth({ auth, db }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    // Parallax State
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        // Calculate normalized position (-1 to 1)
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMousePos({ x, y });
    };

    const checkAndCreateUser = async (user) => {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp()
            });
        }
    };

    const handleSocialLogin = async (provider) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await signInWithPopup(auth, provider);
            await checkAndCreateUser(res.user);
            toast.success(`Welcome, ${res.user.displayName}!`);
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/operation-not-allowed') {
                toast.error("Enable this provider in Firebase Console!");
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.info("Login cancelled");
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Welcome back!");
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(res.user, { displayName: name });
                await setDoc(doc(db, "users", res.user.uid), {
                    uid: res.user.uid,
                    email,
                    displayName: name,
                    photoURL: null,
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp()
                });
                toast.success("Account created successfully!");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="auth-wrapper"
            onMouseMove={handleMouseMove}
            style={{
                position: 'relative', height: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}
        >
            {/* Animated Background with Parallax */}
            <div
                className="auth-particles"
                style={{
                    transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`, // Opposite direction for depth
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
            </div>

            <div className="glass-card" style={{ width: '400px', padding: '40px', zIndex: 10, textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Icon icon="solar:chat-round-line-bold" width="32" />
                    </div>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {isLogin ? 'DeweloperChat Login' : 'Join DeweloperChat'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
                    {isLogin ? 'Securely connect to your developer community' : 'Create your secure developer identity'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {!isLogin && (
                        <input
                            className="input-field"
                            placeholder="Full Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        className="input-field"
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? <Icon icon="line-md:loading-loop" width="24" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    <span>OR CONTINUE WITH</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <button
                        onClick={() => handleSocialLogin(googleProvider)}
                        className="btn"
                        style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Icon icon="logos:google-icon" width="20" />
                        <span>Google</span>
                    </button>
                    <button
                        onClick={() => handleSocialLogin(githubProvider)}
                        className="btn"
                        style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Icon icon="akar-icons:github-fill" width="20" />
                        <span>GitHub</span>
                    </button>
                </div>

                <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '600' }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </span>
                </div>
            </div>
        </div>
    );
}
