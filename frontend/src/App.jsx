import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import LoginPage from './pages/LoginPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import SwipePage from './pages/SwipePage.jsx';
import LikesPage from './pages/LikesPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [internalUser, setInternalUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [tab, setTab] = useState('swipe');
  const [syncing, setSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (firebaseUser === undefined) return;
    if (!firebaseUser) { setInternalUser(null); setUserItems([]); return; }

    const username =
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Usuario';

    setSyncing(true);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebase_uid: firebaseUser.uid, username }),
    })
      .then(r => r.json())
      .then(d => { setInternalUser(d.user); setUserItems(d.items); })
      .finally(() => setSyncing(false));
  }, [firebaseUser]);

  const handleSignOut = () => { setMenuOpen(false); firebaseSignOut(auth); };

  if (firebaseUser === undefined || syncing) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!firebaseUser || !internalUser) return <LoginPage />;

  // New users who haven't completed onboarding
  if (!internalUser.account_type) {
    return (
      <OnboardingPage
        user={internalUser}
        firebaseUser={firebaseUser}
        onDone={(updatedUser) => setInternalUser(updatedUser)}
      />
    );
  }

  const avatarUrl = internalUser.avatar || firebaseUser.photoURL;
  const displayName = internalUser.username || firebaseUser.displayName?.split(' ')[0] || 'Usuario';

  const accountBadge = internalUser.account_type === 'store' ? '🏪' : '👤';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <span className="logo-icon">👗</span>
          <span className="logo-text">SwapWear</span>
        </div>
        <div className="user-menu-wrap">
          <button className="user-chip" onClick={() => setMenuOpen(o => !o)}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
              : <span className="user-avatar">{displayName[0].toUpperCase()}</span>
            }
            <span className="user-name">{accountBadge} {displayName}</span>
          </button>
          {menuOpen && (
            <>
              <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="user-menu-dropdown">
                <button className="user-menu-item" onClick={() => { setMenuOpen(false); setShowProfileEdit(true); }}>
                  ✏️ Editar perfil
                </button>
                <button className="user-menu-item" onClick={() => { setMenuOpen(false); setShowSub(true); }}>
                  {internalUser.tier === 'pro' ? '⚡ Plan Pro' : internalUser.tier === 'basic' ? '✦ Plan Básico' : '⚡ Mejorar plan'}
                </button>
                <button className="user-menu-item signout" onClick={handleSignOut}>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {showSub && <SubscriptionPage user={internalUser} onClose={() => setShowSub(false)} />}
      {showProfileEdit && (
        <ProfileEditPage
          user={internalUser}
          firebaseUser={firebaseUser}
          onClose={() => setShowProfileEdit(false)}
          onSaved={(updatedUser) => setInternalUser(updatedUser)}
        />
      )}

      <main className="app-main">
        {tab === 'swipe' && <SwipePage user={internalUser} />}
        {tab === 'upload' && (
          <UploadPage
            user={internalUser}
            items={userItems}
            onItemsChange={setUserItems}
          />
        )}
        {tab === 'matches' && <MatchesPage user={internalUser} />}
        {tab === 'likes' && <LikesPage user={internalUser} />}
        {tab === 'feedback' && <FeedbackPage user={internalUser} />}
      </main>

      <nav className="bottom-nav">
        <button className={`bnav-btn ${tab === 'swipe' ? 'active' : ''}`} onClick={() => setTab('swipe')}>
          <svg viewBox="0 0 24 24" fill={tab === 'swipe' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
          <span>Explorar</span>
        </button>

        <button className={`bnav-btn ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>
          <svg viewBox="0 0 24 24" fill={tab === 'matches' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>Matches</span>
        </button>

        <button className={`bnav-btn ${tab === 'likes' ? 'active' : ''}`} onClick={() => setTab('likes')}>
          <svg viewBox="0 0 24 24" fill={tab === 'likes' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <span>Guardados</span>
        </button>

        <button className={`bnav-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
          <span className="bnav-badge-wrap" style={{ position: 'relative', display: 'inline-flex' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <path d="M12 8v8M8 12l4-4 4 4"/>
            </svg>
            {userItems.length > 0 && (
              <span className="bnav-badge">{userItems.length}</span>
            )}
          </span>
          <span>Mis Prendas</span>
        </button>

        <button className={`bnav-btn ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}>
          <svg viewBox="0 0 24 24" fill={tab === 'feedback' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M11 5H6a2 2 0 00-2 2v11l4-4h7a2 2 0 002-2v-1"/>
            <path d="M15 3h6v6h-6z"/>
            <path d="M18 3v6M15 6h6"/>
          </svg>
          <span>Feedback</span>
        </button>
      </nav>
    </div>
  );
}
