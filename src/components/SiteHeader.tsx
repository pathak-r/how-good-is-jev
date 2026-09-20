import Link from "next/link";

const links = [
  { href: "/", label: "Compare" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-rule/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-medium">
          How good is Jev?
        </Link>
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
