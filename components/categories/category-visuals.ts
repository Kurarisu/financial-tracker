import {
  BookOpen,
  Bus,
  Gamepad2,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  MoreHorizontal,
  Receipt,
  ShoppingCart,
  Tag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

type CategoryVisual = { icon: LucideIcon; color: string; names: string[]; messageKey: string };

export const categoryVisuals: CategoryVisual[] = [
  { names: ["kuliah", "college"], icon: GraduationCap, color: "#a78bfa", messageKey: "categoryCollege" },
  { names: ["transportasi", "transportation"], icon: Bus, color: "#60a5fa", messageKey: "categoryTransport" },
  { names: ["belanja kebutuhan", "groceries"], icon: ShoppingCart, color: "#fbbf24", messageKey: "categoryGroceries" },
  { names: ["tagihan & utilitas", "tagihan dan utilitas", "bills & utilities", "bills and utilities"], icon: Receipt, color: "#2dd4bf", messageKey: "categoryBills" },
  { names: ["tempat tinggal", "housing"], icon: Home, color: "#fb923c", messageKey: "categoryHousing" },
  { names: ["makanan & minuman", "makanan dan minuman", "food & drinks", "food and drinks"], icon: Utensils, color: "#fb7185", messageKey: "categoryFood" },
  { names: ["kesehatan", "health"], icon: HeartPulse, color: "#f472b6", messageKey: "categoryHealth" },
  { names: ["pendidikan", "education"], icon: BookOpen, color: "#818cf8", messageKey: "categoryEducation" },
  { names: ["donasi & sedekah", "donasi dan sedekah", "donations & charity", "donations and charity"], icon: HandHeart, color: "#34d399", messageKey: "categoryDonations" },
  { names: ["pengeluaran lain-lain", "pengeluaran lain lain", "other expenses"], icon: MoreHorizontal, color: "#94a3b8", messageKey: "categoryOtherExpense" },
  { names: ["hiburan & liburan", "hiburan dan liburan", "entertainment & travel", "entertainment and travel"], icon: Gamepad2, color: "#c084fc", messageKey: "categoryEntertainment" },
];

export function getCategoryVisual(name: string, fallbackColor?: string | null) {
  const normalizedName = name.trim().toLocaleLowerCase("id-ID");
  const visual = categoryVisuals.find((item) => item.names.includes(normalizedName));
  return { icon: visual?.icon ?? Tag, color: visual?.color ?? fallbackColor ?? "#94a3b8", messageKey: visual?.messageKey };
}
