export interface OgData {
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
}

export async function fetchOpenGraph(url: string): Promise<OgData> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Lately/1.0)' },
    });
    if (!res.ok) return {};

    const html = await res.text();

    const get = (property: string): string | undefined => {
      const match =
        html.match(
          new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, 'i')
        ) ??
        html.match(
          new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${property}"`, 'i')
        );
      return match?.[1];
    };

    return {
      title: get('og:title') ?? get('twitter:title'),
      description: get('og:description') ?? get('twitter:description'),
      image_url: get('og:image') ?? get('twitter:image'),
      site_name: get('og:site_name'),
    };
  } catch {
    return {};
  }
}
