import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { Category } from "../lib/types";

export type IconName =
  | Category
  | "pin"
  | "heart"
  | "heart-filled"
  | "home"
  | "user"
  | "search"
  | "share"
  | "external"
  | "back"
  | "chevron"
  | "info"
  | "refresh";

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** İnce çizgili, tek renkli simgeler (tasarımdaki gibi). */
export function Icon({ name, size = 22, color = "#1E1B3A", strokeWidth = 2 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {paths(name, p, color)}
    </Svg>
  );
}

function paths(name: IconName, p: object, color: string) {
  switch (name) {
    case "konser":
      return (<><Rect x="9" y="3" width="6" height="11" rx="3" {...p} /><Path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" {...p} /></>);
    case "stand-up":
      return (<><Circle cx="12" cy="12" r="9" {...p} /><Path d="M8 14c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2M9 9.5h.01M15 9.5h.01" {...p} /></>);
    case "mac":
      return (<><Circle cx="12" cy="12" r="9" {...p} /><Path d="M12 7l4 3-1.5 4.5h-5L8 10z M12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5l-2.5 4M8 10L3.5 8.5" {...p} /></>);
    case "spor":
      return <Path d="M13 2L4 14h7l-1 8 9-12h-7z" {...p} />;
    case "tiyatro":
      return (<><Path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z" {...p} /><Path d="M10 5v14" {...p} strokeDasharray="2 2" /></>);
    case "sergi":
      return (<><Rect x="3" y="4" width="18" height="14" rx="2" {...p} /><Path d="M7 14l3-4 3 3 2-2 3 3M8 21h8" {...p} /></>);
    case "festival":
      return (<><Path d="M5 21V4M5 4h12l-2 4 2 4H5" {...p} /></>);
    case "atolye":
      return (<><Path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1-2-.7-1.2.1-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 7 17 3 12 3z" {...p} /><Path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01" {...p} /></>);
    case "doga":
      return (<><Path d="M3 20l6-10 4 6 2-3 6 7z" {...p} /><Circle cx="17" cy="6" r="2" {...p} /></>);
    case "yemek":
      return (<><Path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3" {...p} /></>);
    case "gece-hayati":
      return <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {...p} />;
    case "aile":
      return (<><Circle cx="9" cy="8" r="3" {...p} /><Circle cx="17" cy="10" r="2.2" {...p} /><Path d="M3 20c.8-3.5 3.2-5.5 6-5.5s5.2 2 6 5.5M15 15.5c2.5-.4 4.8 1 6 4.5" {...p} /></>);
    case "pin":
      return (<><Path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" {...p} /><Circle cx="12" cy="10" r="2.5" {...p} /></>);
    case "heart":
      return <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} />;
    case "heart-filled":
      return <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} fill={color} />;
    case "home":
      return <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />;
    case "user":
      return (<><Circle cx="12" cy="8" r="4" {...p} /><Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...p} /></>);
    case "search":
      return (<><Circle cx="11" cy="11" r="7" {...p} /><Path d="M20 20l-3.5-3.5" {...p} /></>);
    case "share":
      return (<><Path d="M12 3v12M7 8l5-5 5 5" {...p} /><Path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" {...p} /></>);
    case "external":
      return (<><Path d="M14 4h6v6M20 4l-9 9" {...p} /><Path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...p} /></>);
    case "back":
      return <Path d="M15 5l-7 7 7 7" {...p} />;
    case "chevron":
      return <Path d="M9 6l6 6-6 6" {...p} />;
    case "info":
      return (<><Circle cx="12" cy="12" r="9" {...p} /><Path d="M12 11v5M12 8h.01" {...p} /></>);
    case "refresh":
      return (<><Path d="M20 11a8 8 0 1 0-2.3 5.7" {...p} /><Path d="M20 4v7h-7" {...p} /></>);
  }
}
