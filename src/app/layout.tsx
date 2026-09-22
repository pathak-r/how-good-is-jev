import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = "https://www.rohitpathak.com/how-good-is-jev";
const description =
  "On a CLINC150 request, Jev and GPT-5.6 Terra both routed correctly. Jev was 97% cheaper and 95% faster.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rohitpathak.com"),
  title: "How good is Jev?",
  description,
  authors: [{ name: "Rohit Pathak", url: "https://www.rohitpathak.com" }],
  openGraph: {
    type: "article",
    title: "Compare Jev with GPT-5.6 Terra",
    description,
    url: siteUrl,
    siteName: "Rohit Pathak",
    authors: ["Rohit Pathak"],
    images: [
      {
        url: "https://www.rohitpathak.com/how-good-is-jev/og",
        width: 1200,
        height: 630,
        alt: "On a CLINC150 request, Jev and GPT-5.6 Terra both routed correctly. Jev was 97% cheaper and 95% faster.",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body className="font-sans text-ink antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
