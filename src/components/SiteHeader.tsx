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
    <header className="border-b border-rule/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <a href={siteHref} className="text-sm text-mute hover:text-ink">
            ← Rohit Pathak
          </a>
          <Link href="/" className="font-display text-xl font-medium">
            How good is Jev?
          </Link>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
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
