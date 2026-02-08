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
  textColor: string;
  iconColor: string;
  bgColor: string;
};

export function Tag({ label, icon, textColor, iconColor, bgColor }: TagProps) {
  const IconComponent = iconMap[icon];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5" style={{ color: iconColor }} />}
      {label}
    </span>
  );
}
