import { ImageResponse } from "next/og";

const size = { width: 1200, height: 630 };
const ink = "#1b1914";
const mute = "#6d675c";
const rule = "#d8d1c2";
const paper = "#f3efe4";
const card = "#fffdf7";
const good = "#2f6b4f";

const cells = [
  {
    label: "Agreement",
    value: "Agree",
    detail: "Both correct",
    detailColor: good,
    detailFont: "Inter",
  },
  {
    label: "Cost · Jev vs LLM",
    value: "97% cheaper",
    detail: "$0.00359 → $8.97e-5",
    detailColor: ink,
    detailFont: "IBM Plex Mono",
  },
  {
    label: "Latency · Jev vs LLM",
    value: "95% faster",
    detail: "4710 ms → 242 ms",
    detailColor: ink,
    detailFont: "IBM Plex Mono",
  },
] as const;

export async function renderShareImage() {
  const [inter, interMedium, serif, mono] = await Promise.all([
    loadGoogleFont("Inter", 400),
    loadGoogleFont("Inter", 500),
    loadGoogleFont("Source Serif 4", 400),
    loadGoogleFont("IBM Plex Mono", 400),
  ]);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: paper,
          color: ink,
          padding: "48px 56px 52px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ display: "flex", fontFamily: "Source Serif 4", fontSize: 42, lineHeight: 1 }}>
            How good is Jev?
          </div>
          <div style={{ display: "flex", fontSize: 22, color: mute }}>Rohit Pathak</div>
        </div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 22, color: mute }}>
          Compare Jev with GPT-5.6 Terra on CLINC150
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            marginTop: 32,
            background: card,
            border: `1px solid ${rule}`,
          }}
        >
          {cells.map((cell, index) => (
            <div
              key={cell.label}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                padding: "0 28px",
                borderRight: index === cells.length - 1 ? "none" : `1px solid ${rule}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: mute,
                }}
              >
                {cell.label}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 18,
                  fontFamily: "Source Serif 4",
                  fontSize: 44,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {cell.value}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 16,
                  fontFamily: cell.detailFont,
                  fontSize: 22,
                  color: cell.detailColor,
                }}
              >
                {cell.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter, weight: 400, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Source Serif 4", data: serif, weight: 400, style: "normal" },
        { name: "IBM Plex Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
  image.headers.set("Cache-Control", "public, max-age=86400");
  return image;
}

const fontCache = new Map<string, Promise<ArrayBuffer>>();

function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const pending = fetchGoogleFont(family, weight);
  fontCache.set(key, pending);
  return pending;
}

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
  ).then((response) => {
    if (!response.ok) throw new Error(`Font CSS failed for ${family} ${weight}`);
    return response.text();
  });
  const match = css.match(/src: url\((.+?)\) format\('truetype'\)/);
  if (!match) throw new Error(`No TTF for ${family} ${weight}`);
  const font = await fetch(match[1]);
  if (!font.ok) throw new Error(`Font download failed for ${family} ${weight}`);
  return font.arrayBuffer();
}
