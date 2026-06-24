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
import { Icon, Logo } from './components/Icons.jsx';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [internalUser, setInternalUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [tab, setTab] = useState('swipe');
  const [syncing, setSyncing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [matchNotif, setMatchNotif] = useState(0);
  const [savedNotif, setSavedNotif] = useState(0);

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

  useEffect(() => {
    if (!internalUser) return;
    const KEY_M = `sw_notif_seen_${internalUser.id}`;
    const KEY_S = `sw_notif_seen_saved_${internalUser.id}`;
    const fetchNotifs = () => {
      const sinceM = localStorage.getItem(KEY_M) || new Date(0).toISOString();
      const sinceS = localStorage.getItem(KEY_S) || new Date(0).toISOString();
      fetch(`/api/notifications?user_id=${internalUser.id}&since_matches=${encodeURIComponent(sinceM)}&since_saved=${encodeURIComponent(sinceS)}`)
        .then(r => r.json())
        .then(d => { setMatchNotif(d.new_matches || 0); setSavedNotif(d.unread_saved || 0); })
        .catch(() => {});
    };
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [internalUser]);

  const goToMatches = () => {
    if (internalUser) localStorage.setItem(`sw_notif_seen_${internalUser.id}`, new Date().toISOString());
    setMatchNotif(0);
    setTab('matches');
  };

  const goToSaved = () => {
    if (internalUser) localStorage.setItem(`sw_notif_seen_saved_${internalUser.id}`, new Date().toISOString());
    setSavedNotif(0);
    setTab('likes');
  };

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <Logo size={28} />
          <span className="logo-text">SwapWear</span>
        </div>
        <div className="user-menu-wrap">
          <button className="user-chip" onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Abrir menú de perfil">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="user-avatar-img" />
              : <span className="user-avatar">{displayName[0].toUpperCase()}</span>
            }
            <span className="user-name">
              {internalUser.account_type === 'store' ? <Icon.Store size={14} /> : <Icon.User size={14} />}
              {displayName}
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="user-menu-dropdown" role="menu">
                <button className="user-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); setShowProfileEdit(true); }}>
                  <Icon.Edit size={18} /> Editar perfil
                </button>
                <button className="user-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); setShowSub(true); }}>
                  <Icon.Sparkles size={18} /> {internalUser.tier === 'pro' ? 'Plan Pro' : internalUser.tier === 'basic' ? 'Plan Básico' : 'Mejorar plan'}
                </button>
                <button className="user-menu-item signout" role="menuitem" onClick={handleSignOut}>
                  <Icon.Logout size={18} /> Cerrar sesión
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

      <nav className="bottom-nav" aria-label="Navegación principal">
        <button className={`bnav-btn ${tab === 'swipe' ? 'active' : ''}`} onClick={() => setTab('swipe')} aria-current={tab === 'swipe' ? 'page' : undefined} aria-label="Explorar">
          <Icon.Compass />
          <span>Explorar</span>
        </button>

        <button className={`bnav-btn ${tab === 'matches' ? 'active' : ''}`} onClick={goToMatches} aria-current={tab === 'matches' ? 'page' : undefined} aria-label="Matches">
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon.Inbox />
            {matchNotif > 0 && <span className="bnav-badge">{matchNotif}</span>}
          </span>
          <span>Matches</span>
        </button>

        <button className={`bnav-btn ${tab === 'likes' ? 'active' : ''}`} onClick={goToSaved} aria-current={tab === 'likes' ? 'page' : undefined} aria-label="Chats">
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon.Chats />
            {savedNotif > 0 && <span className="bnav-badge">{savedNotif}</span>}
          </span>
          <span>Chats</span>
        </button>

        <button className={`bnav-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')} aria-current={tab === 'upload' ? 'page' : undefined} aria-label="Mis prendas">
          <Icon.Grid />
          <span>Mis Prendas</span>
        </button>

        <button className={`bnav-btn ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')} aria-current={tab === 'feedback' ? 'page' : undefined} aria-label="Feedback">
          <Icon.Chat />
          <span>Feedback</span>
        </button>
      </nav>
    </div>
  );
}
