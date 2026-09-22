import { renderShareImage } from "./card";

export const runtime = "nodejs";

export function GET() {
  return renderShareImage();
}
