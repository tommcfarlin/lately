import ThemeToggle from "./ThemeToggle";

const siteTitle = process.env.LATELY_SITE_TITLE ?? "Lately";
const subtitle = process.env.LATELY_SUBTITLE ?? "";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {siteTitle}
          </span>
          {subtitle && (
            <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </span>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
