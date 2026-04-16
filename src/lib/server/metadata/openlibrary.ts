import type { BookData } from '$lib/types/post';

const OL_BASE = 'https://openlibrary.org';
const OL_COVERS = 'https://covers.openlibrary.org/b';

export async function lookupByIsbn(isbn: string): Promise<BookData> {
  const res = await fetch(`${OL_BASE}/isbn/${isbn}.json`);
  if (!res.ok) throw new Error(`Open Library ISBN lookup failed: ${res.status}`);

  const book = await res.json();
  let author = 'Unknown';

  if (book.authors?.length) {
    const authorRes = await fetch(`${OL_BASE}${book.authors[0].key}.json`);
    if (authorRes.ok) {
      const authorData = await authorRes.json();
      author = authorData.name ?? 'Unknown';
    }
  }

  const cleanIsbn = isbn.replace(/[^0-9X]/g, '');

  return {
    title: book.title,
    author,
    isbn: cleanIsbn,
    cover_url: `${OL_COVERS}/isbn/${cleanIsbn}-L.jpg`,
    source_url: `${OL_BASE}/isbn/${cleanIsbn}`
  };
}

export async function searchBooks(title: string, author?: string): Promise<BookData[]> {
  const params = new URLSearchParams({ title, limit: '8' });
  if (author) params.set('author', author);

  const res = await fetch(`${OL_BASE}/search.json?${params}`);
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);

  const json = await res.json();
  return json.docs.slice(0, 8).map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown',
    isbn: doc.isbn?.[0],
    cover_url: doc.isbn?.[0]
      ? `${OL_COVERS}/isbn/${doc.isbn[0]}-M.jpg`
      : undefined,
    source_url: doc.key ? `${OL_BASE}${doc.key}` : undefined
  }));
}
