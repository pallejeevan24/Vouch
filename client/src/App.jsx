import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Verify from "./pages/Verify.jsx";
import Analyzer from "./pages/Analyzer.jsx";
import Independent from "./pages/Independent.jsx";
import { clearSession, getUser } from "./api.js";

export default function App() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">Vouch<span>.</span></Link>
        <nav>
          <Link to="/analyze">Analyse</Link>
          <Link to="/verify">Verify</Link>
          <Link to="/independent">Independent check</Link>
          {user ? (
            <>
              <Link to="/dashboard">My documents</Link>
              <button className="link" onClick={logout}>Log out ({user.name})</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn small">Get started</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Auth mode="login" onAuth={setUser} />} />
          <Route path="/register" element={<Auth mode="register" onAuth={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/analyze" element={<Analyzer />} />
          <Route path="/independent" element={<Independent />} />
        </Routes>
      </main>
    </>
  );
}

function Home({ user }) {
  const steps = [
    ["1", "Upload", "Log in and upload any contract, certificate or ID proof."],
    ["2", "Fingerprint", "Vouch computes its SHA-256 hash. The file stays in secure storage; only the hash is public."],
    ["3", "Anchor", "A smart contract records the hash, block timestamp and your user reference on the blockchain."],
    ["4", "Prove", "Download a PDF certificate with a QR code. Anyone can scan it and verify the file."],
  ];
  return (
    <>
      <section className="hero">
        <h1>Prove a document existed, exactly as it is.</h1>
        <p>
          Vouch fingerprints your file with SHA-256, anchors the fingerprint on a blockchain, and gives you a
          QR-coded proof certificate anyone can verify in seconds. Your file never goes on-chain.
        </p>
        <div className="row">
          <Link className="btn" to={user ? "/dashboard" : "/register"}>Notarize a document</Link>
          <Link className="btn outline" to="/verify">Verify a document</Link>
          <Link className="btn outline" to="/analyze">Analyse metadata</Link>
        </div>
      </section>
      <section className="steps">
        {steps.map(([n, t, d]) => (
          <div className="card step" key={n}>
            <div className="num">{n}</div>
            <h3>{t}</h3>
            <p className="muted">{d}</p>
          </div>
        ))}
      </section>
      <p className="muted small-note">
        Vouch provides tamper-evident proof of existence and integrity. It is not by itself a statutory notarial act.
      </p>
    </>
  );
}
