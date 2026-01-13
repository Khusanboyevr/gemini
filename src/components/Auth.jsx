
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Icon } from "@iconify/react";
import { toast } from 'react-toastify';

export default function Auth({ auth, db }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

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
        <div className="auth-wrapper" style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', overflow: 'hidden' }}>
            {/* Animated Background */}
            <div className="auth-circles">
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

                <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
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
