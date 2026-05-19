"use client";

import { useState } from "react";

export function CheckoutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.demo && data.successUrl) {
        window.location.href = data.successUrl;
        return;
      }
      alert(data.error ?? "Checkout failed. Try again.");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={checkout}
      disabled={loading}
      className={`btn-primary ${className}`}
    >
      {loading ? "Redirecting…" : "Buy & download installer"}
    </button>
  );
}
