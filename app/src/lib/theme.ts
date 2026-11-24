import type { Category } from "./types";

/** "Neşeli Kartlar" tasarım dili. */
export const colors = {
  bg: "#F6F4FF",
  surface: "#FFFFFF",
  ink: "#1E1B3A",
  muted: "#5C5878",
  line: "#E4E0F5",
  accent: "#4B3FD1",
  accentSoft: "#E6E3FF",
  nav: "#1E1B3A",
  navMuted: "#C9C5E8",
  warnBg: "#FFF3D6",
  warnInk: "#6B4A00",
  danger: "#B3261E",
};

/** Her kategori için kart zemini ve üstündeki yazı rengi (4.5:1 kontrastlı). */
export const categoryColors: Record<Category, { bg: string; ink: string; label: string }> = {
  konser: { bg: "#FFD8C7", ink: "#8A3517", label: "Konser" },
  mac: { bg: "#FFE9A8", ink: "#6E5100", label: "Maç" },
  tiyatro: { bg: "#E7D9FF", ink: "#4B2F91", label: "Tiyatro" },
  "stand-up": { bg: "#FFE0EC", ink: "#8C1F4A", label: "Stand-up" },
  sergi: { bg: "#C9F0E0", ink: "#1F5C47", label: "Sergi" },
  festival: { bg: "#D9E4FF", ink: "#26398C", label: "Festival" },
  atolye: { bg: "#FFE4C2", ink: "#744600", label: "Atölye" },
  doga: { bg: "#D6F2C9", ink: "#2F5E1F", label: "Doğa" },
  spor: { bg: "#CFEFF7", ink: "#155868", label: "Spor" },
  yemek: { bg: "#FFDCCC", ink: "#82351A", label: "Yeme-İçme" },
  "gece-hayati": { bg: "#DDD9F7", ink: "#2E2A6B", label: "Gece Hayatı" },
  aile: { bg: "#FFF0B8", ink: "#625000", label: "Çocuklu Aile" },
};

export const fonts = {
  display: "Fredoka_700Bold",
  displaySemi: "Fredoka_600SemiBold",
  body: "Rubik_400Regular",
  bodyMedium: "Rubik_500Medium",
  bodySemi: "Rubik_600SemiBold",
};

export const radius = { card: 26, md: 20, sm: 14, pill: 999 };
/** Yüzen sekme çubuğunun altında içerik kalmasın diye ekranların alt boşluğu. */
export const TAB_BAR_SPACE = 110;
export const space = (n: number) => n * 4;
