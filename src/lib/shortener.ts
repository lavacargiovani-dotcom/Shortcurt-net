export type ShortLink = {
  id: string;
  originalUrl: string;
  slug: string;
  createdAt: string;
  clicks: number;
};

const STORAGE_KEY = 'orbit-short-links';
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

export function getLinks(): ShortLink[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ShortLink[];
  } catch {
    return [];
  }
}

export function saveLinks(links: ShortLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function makeSlug() {
  return Math.random().toString(36).slice(2, 8);
}

export function publicUrl(slug: string) {
  return `${window.location.origin}/s/${slug}`;
}

export async function createLink(originalUrl: string, customSlug?: string): Promise<ShortLink> {
  if (API_BASE) {
    try {
      const response = await fetch(`${API_BASE}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_url: originalUrl, slug: customSlug || undefined }),
      });
      if (response.ok) {
        const payload = await response.json();
        const remote = payload.data ?? payload;
        return { id: String(remote.id ?? crypto.randomUUID()), originalUrl, slug: remote.shortened_url ?? remote.slug, createdAt: new Date().toISOString(), clicks: 0 };
      }
    } catch {
      // The local mode keeps the demo usable while an API is unavailable.
    }
  }

  const links = getLinks();
  const slug = customSlug?.trim() || makeSlug();
  if (links.some((link) => link.slug === slug)) throw new Error('Esse alias já está em uso. Escolha outro.');
  const link: ShortLink = { id: crypto.randomUUID(), originalUrl, slug, createdAt: new Date().toISOString(), clicks: 0 };
  saveLinks([link, ...links]);
  return link;
}

export function removeLink(id: string) {
  saveLinks(getLinks().filter((link) => link.id !== id));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}
