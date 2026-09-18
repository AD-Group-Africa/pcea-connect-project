"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import api from "@/lib/api";

interface SearchResult {
  id: string;
  name?: string;
  title?: string;
  fullName?: string;
  text?: string;
  description?: string;
  location?: string;
  email?: string;
  type?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, SearchResult[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await api.get(`/api/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data.data || {});
    } catch {
      setResults(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results && Object.values(results).some((items) => items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find members, sermons, events, Bible verses and more
        </p>
      </div>

      <form role="search" onSubmit={handleSearch} className="flex max-w-2xl gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the church directory…"
          aria-label="Search"
          autoFocus
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-300">
          Search is unavailable right now. Please try again.
        </p>
      )}

      {searched && !loading && !error && !hasResults && (
        <div className="py-14 text-center">
          <p className="text-lg font-medium text-white">No results for “{query.trim()}”</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the spelling, or try a broader term.
          </p>
        </div>
      )}

      {results && hasResults && (
        <div className="grid max-w-4xl gap-6">
          {Object.entries(results).map(([category, items]) =>
            items.length === 0 ? null : (
              <div key={category}>
                <h2 className="mb-2 text-xl font-semibold capitalize text-white">
                  {category.replace(/_/g, " ")}
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <Card key={item.id} className="bg-card">
                      <CardContent className="p-4">
                        <p className="font-medium text-white">
                          {item.name || item.title || item.fullName || (item.text || "").slice(0, 140) || "—"}
                        </p>
                        {(item.description || item.location || item.email || item.type) && (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {item.description || item.location || item.email || item.type}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
