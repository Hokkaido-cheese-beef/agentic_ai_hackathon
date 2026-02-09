import {
  Wallet,
  Clock,
  MapPin,
  Star,
  Heart,
  Utensils,
  Car,
  Train,
  Plane,
  Bus,
  Coffee,
  Camera,
  Sun,
  Cloud,
  Umbrella,
  Thermometer,
  Mountain,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  clock: Clock,
  "map-pin": MapPin,
  star: Star,
  heart: Heart,
  utensils: Utensils,
  car: Car,
  train: Train,
  plane: Plane,
  bus: Bus,
  coffee: Coffee,
  camera: Camera,
  sun: Sun,
  cloud: Cloud,
  umbrella: Umbrella,
  thermometer: Thermometer,
  mountain: Mountain,
  trees: Trees,
  waves: Waves,
};

type TagProps = {
  label: string;
  icon: string;
  textColor?: string;
  iconColor?: string;
  bgColor?: string;
};

// タグラベルのハッシュから配色インデックスを決定
function getColorIndex(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3;
}

// タグ配色パレット（globals.cssの--tag-color-N に対応）
const tagColors = [
  { bg: "#EFF6FF", text: "#1E40AF", icon: "#3B82F6" }, // 青系
  { bg: "#D1FAE5", text: "#065F46", icon: "#10B981" }, // 緑系
  { bg: "#FEF3C7", text: "#92400E", icon: "#F59E0B" }, // 黄系
];

export function Tag({ label, icon, textColor, iconColor, bgColor }: TagProps) {
  const IconComponent = iconMap[icon];

  // props優先、未指定時はラベルから自動決定
  const colorIndex = getColorIndex(label);
  const colors = tagColors[colorIndex];
  const finalBgColor = bgColor ?? colors.bg;
  const finalTextColor = textColor ?? colors.text;
  const finalIconColor = iconColor ?? colors.icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium"
      style={{ backgroundColor: finalBgColor, color: finalTextColor }}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5" style={{ color: finalIconColor }} />}
      {label}
    </span>
  );
}
