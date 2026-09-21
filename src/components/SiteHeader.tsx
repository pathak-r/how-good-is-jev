import Link from "next/link";

const links = [
  { href: "/", label: "Compare" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
];

const siteHref = process.env.NEXT_PUBLIC_BASE_PATH?.startsWith("/how-good-is-jev")
  ? "/"
  : "https://www.rohitpathak.com/";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between gap-6 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-1.5">
          <a href={siteHref} className="text-xs text-mute hover:text-ink">
            ← Rohit Pathak
          </a>
          <Link href="/" className="font-display text-lg leading-none">
            How good is Jev?
          </Link>
        </div>
        <nav className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-sm text-mute">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
