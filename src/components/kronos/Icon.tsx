"use client";

/**
 * The one icon surface for Kronos (audit 2026-09-15, systemic issue S7: emoji as
 * icons in 71 files, plus unicode arrows used as affordances).
 *
 * Rules baked in here:
 * - `lucide-react` only. No emoji, no hand-drawn SVG, no text glyphs.
 * - Three sizes: 16 (inline with body copy), 20 (default), 24 (touch targets).
 * - Decorative by default (`aria-hidden`), because an icon next to its own label
 *   is noise for a screen reader. Pass `label` for a standalone icon button and
 *   it becomes `role="img"` with that name.
 *
 * The legacy hand-rolled set in `kronos/v3/icons.tsx` still exists for the V3
 * dashboard shell; new code uses this component.
 */
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  Ban,
  Banknote,
  Bell,
  Bot,
  CalendarDays,
  Camera,
  ChartColumn,
  Check,
  CircleCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Circle,
  CircleX,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  Dumbbell,
  FileText,
  Globe,
  Image,
  Landmark,
  Link2,
  Mail,
  Medal,
  Megaphone,
  Minus,
  Package,
  Pencil,
  Pin,
  RotateCcw,
  Scale,
  Scissors,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Trash,
  TriangleAlert,
  Trophy,
  Undo2,
  Upload,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

export const ICONS = {
  alert: TriangleAlert,
  archive: Archive,
  arrowDown: ArrowDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight,
  award: Award,
  bank: Landmark,
  bell: Bell,
  blocked: Ban,
  bot: Bot,
  calendar: CalendarDays,
  camera: Camera,
  card: CreditCard,
  cash: Banknote,
  chart: ChartColumn,
  check: Check,
  checkCircle: CircleCheck,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  circle: Circle,
  clipboard: ClipboardList,
  clock: Clock,
  discount: Scissors,
  document: FileText,
  download: Download,
  edit: Pencil,
  failed: CircleX,
  flat: Minus,
  filter: SlidersHorizontal,
  globe: Globe,
  image: Image,
  link: Link2,
  mail: Mail,
  megaphone: Megaphone,
  metrics: Scale,
  package: Package,
  phone: Smartphone,
  pin: Pin,
  refund: Undo2,
  retry: RotateCcw,
  search: Search,
  send: Send,
  settings: Settings,
  shield: ShieldCheck,
  sort: ChevronsUpDown,
  spark: Sparkles,
  star: Star,
  tag: Tag,
  trash: Trash,
  trophy: Trophy,
  upload: Upload,
  users: Users,
  wallet: Wallet,
  wod: Dumbbell,
  medal: Medal,
  close: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** 16 inline with body copy · 20 default · 24 for touch targets. */
export type IconSize = 16 | 20 | 24;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** Give the icon an accessible name; omit it when a text label sits beside it. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 20,
  label,
  className,
  style,
  strokeWidth = 1.75,
}: IconProps) {
  const Glyph = ICONS[name];
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true, focusable: false } as const);

  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      {...a11y}
    />
  );
}

export default Icon;
