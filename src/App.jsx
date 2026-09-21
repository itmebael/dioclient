import React from "react";

export default function App() {
  return (
    <main
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "640px",
          padding: "32px 24px",
          textAlign: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#111827",
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          Client portal
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            lineHeight: 1.15,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          ParishLink
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "#111827",
          }}
        >
          This workspace is for the client experience only.
        </p>
      </section>
    </main>
  );
}
