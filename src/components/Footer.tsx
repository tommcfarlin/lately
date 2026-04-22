const socialLinksRaw = process.env.LATELY_SOCIAL_LINKS ?? "";

type SocialLink = { label: string; url: string };

function parseSocialLinks(raw: string): SocialLink[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => {
      const [label, url] = entry.split("|").map((s) => s.trim());
      return label && url ? { label, url } : null;
    })
    .filter((x): x is SocialLink => x !== null);
}

const socialLinks = parseSocialLinks(socialLinksRaw);

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>&copy; {new Date().getFullYear()}</span>
        {socialLinks.length > 0 && (
          <nav aria-label="Social links" className="flex gap-4">
            {socialLinks.map(({ label, url }) => (
              <a
                key={url}
                href={url}
                className="hover:text-zinc-900 dark:hover:text-zinc-50"
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </footer>
  );
}
