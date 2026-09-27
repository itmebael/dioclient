import React from "react";

export default function App() {
  return (
    <main className="portal-page">
      <section className="portal-card" aria-label="ParishLink client portal">
        <img className="portal-logo" src="/logo.png" alt="ParishLink logo" />
        <p className="portal-eyebrow">Client portal</p>
        <h1>ParishLink</h1>
        <p className="portal-description">
          Your parish services, connected in one place.
        </p>
        <div className="portal-accent" aria-hidden="true" />
      </section>
    </main>
  );
}
