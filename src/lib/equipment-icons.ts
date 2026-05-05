/**
 * Best-effort emoji mapping for CrossFit equipment.
 * Falls back to a generic tool emoji for unknown items.
 */
export function getEquipmentIcon(name: string): string {
  const map: Record<string, string> = {
    barbell: "🏋️",
    plates: "⚪",
    dumbbell: "💪",
    kettlebell: "🔔",
    rack: "🗄️",
    bench: "🪑",
    "pull-up bar": "🧗",
    "pull up bar": "🧗",
    rope: "🪢",
    box: "📦",
    wallball: "🏐",
    "rowing machine": "🚣",
    rower: "🚣",
    bike: "🚴",
    running: "🏃",
    "jump rope": "➰",
    "medicine ball": "🏀",
    abmat: "🧘",
    bands: "🪗",
    mat: "🧘",
    rings: "💍",
    parallettes: "📏",
    "peg board": "🪜",
    sled: "🛷",
    tire: "🛞",
    yoke: "🦬",
    sandbag: "🎒",
    "slam ball": "🎱",
  };

  const key = name.toLowerCase().trim();
  return map[key] ?? "🔧";
}
