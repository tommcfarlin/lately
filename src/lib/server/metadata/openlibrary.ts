import type { BookData } from '@/lib/types/post';

export async function searchBooks(query: string): Promise<BookData[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=title,author_name,isbn,cover_i,key`
  );
  if (!res.ok) return [];
  const json = await res.json();

  return json.docs.map((r: Record<string, unknown>) => {
    const isbn = Array.isArray(r.isbn) ? (r.isbn as string[])[0] : undefined;
    const coverId = r.cover_i as number | undefined;
    return {
      title: r.title as string,
      author: Array.isArray(r.author_name)
        ? (r.author_name as string[])[0]
        : 'Unknown',
      cover_url: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : undefined,
      isbn,
      source_url: `https://openlibrary.org${r.key}`,
    };
  });
}

export async function lookupIsbn(isbn: string): Promise<BookData | null> {
  const clean = isbn.replace(/-/g, '');
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const book = json[`ISBN:${clean}`];
  if (!book) return null;

  return {
    title: book.title,
    author: book.authors?.[0]?.name ?? 'Unknown',
    cover_url: book.cover?.large ?? book.cover?.medium,
    isbn: clean,
    source_url: `https://openlibrary.org${book.key}`,
  };
}
