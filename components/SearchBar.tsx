"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/catalogue${params.size ? `?${params}` : ""}`);
  }

  return (
    <form className="search-bar" onSubmit={submit} role="search">
      <input
        type="search"
        name="q"
        placeholder="Rechercher un document..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Rechercher un document"
      />
      <button type="submit" className="btn btn-primary btn-small">
        Rechercher
      </button>
    </form>
  );
}
