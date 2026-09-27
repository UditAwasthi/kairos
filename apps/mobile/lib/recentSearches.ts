const KEY = 'kairos.recent-searches';
const MAX = 8;
let memory: string[] = [];

export function listRecentSearches(): string[] {
  return [...memory];
}

export function rememberSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return listRecentSearches();
  memory = [trimmed, ...memory.filter((item) => item !== trimmed)].slice(0, MAX);
  return listRecentSearches();
}

export function hydrateRecentSearches(items: string[]) {
  memory = items.filter(Boolean).slice(0, MAX);
}

export function recentSearchStorageKey() {
  return KEY;
}
