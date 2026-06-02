"use client";

import { useState } from "react";

export default function ChecklisteForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-green-600/20 border border-green-500/30 rounded-xl px-6 py-4 text-green-300 text-sm">
        Danke! Die Checkliste wird in Kürze verfügbar sein. Wir informieren Sie per E-Mail sobald der Download aktiviert ist.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ihre E-Mail-Adresse"
        className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
      >
        {submitting ? "..." : "Checkliste senden"}
      </button>
    </form>
  );
}
