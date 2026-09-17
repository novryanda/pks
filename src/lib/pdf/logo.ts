// Get logo as base64 data URL for @react-pdf/renderer
export function getLogoBase64(): string {
  // Client-side: return the public path
  if (typeof window !== "undefined") {
    return "/LOGO TRT.png";
  }

  // Server-side: use fs to get base64
  try {
    // We use conditional require to avoid bundling fs on the client
    const path = require("path");
    const fs = require("fs");
    const logoPath = path.join(process.cwd(), "public", "LOGO TRT.png");

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const base64 = logoBuffer.toString("base64");
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.warn("Could not load logo from fs, falling back to URL path");
  }

  return "/LOGO TRT.png";
}

// Company info constants
export const COMPANY_NAME = "PT. TARO RAKAYA TASYRA";
export const COMPANY_SUBTITLE = "Palm Oil Mill - Pabrik Kelapa Sawit";
export const COMPANY_ADDRESS_LINES = [
  "Jl. Lintas Langgam KM3",
  "Desa Lubuk Ogung",
  "Kec.Bandar Sei kijang",
  "Pelalawan - Riau",
];
export const COMPANY_ADDRESS = COMPANY_ADDRESS_LINES.join("\n");
