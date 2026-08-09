/**
 * Shared Marketplace Categories — HOVIN Mobile
 *
 * SYNCHRONIZED with web's lib/marketplace/categories.ts.
 * THIS IS THE SINGLE SOURCE OF TRUTH for product categorization on mobile.
 * Do NOT hardcode category lists in individual screens — import from here.
 *
 * Categories match Egyptian hospitality procurement taxonomy:
 * FB (F&B), HK (Housekeeping), FFE (Furniture/Fixtures), OSE (Operating Supplies),
 * GRA (Guest Amenities), LIN (Linens), ENG (Engineering), SPA (Spa/Recreation),
 * IT (Technology), SEC (Safety/Security)
 */

export interface HotelCategory {
  id: string;
  code: string;
  label: string;
  labelAr: string;
  description: string;
  icon: string; // lucide icon name
  color: string;
  examples: string[];
  keywords: string[];
}

/** Canonical 10-category hotel procurement taxonomy */
export const HOTEL_CATEGORIES: HotelCategory[] = [
  {
    id: "fb",
    code: "FB",
    label: "F&B",
    labelAr: "الأغذية والمشروبات",
    description: "Food, beverages, kitchen equipment, chinaware, glassware, and silverware",
    icon: "UtensilsCrossed",
    color: "#F59E0B",
    examples: ["Beef Cuts", "Fresh Produce", "Kitchen Equipment", "Glassware", "Coffee Machines"],
    keywords: ["food", "beverage", "kitchen", "restaurant", "bar", "catering", "chef", "dining"],
  },
  {
    id: "hk",
    code: "HK",
    label: "Housekeeping",
    labelAr: "التدبير المنزلي",
    description: "Cleaning chemicals, equipment, carts, and operational supplies for room maintenance",
    icon: "Sparkles",
    color: "#0EA5E9",
    examples: ["Cleaning Chemicals", "Vacuum Cleaners", "Mops", "Laundry Detergent", "Trash Bins"],
    keywords: ["clean", "housekeeping", "room service", "laundry", "sanitation", "hygiene"],
  },
  {
    id: "ffe",
    code: "FFE",
    label: "FFE",
    labelAr: "الأثاث والتجهيزات",
    description: "Furniture, Fixtures & Equipment — room furniture, lobby fixtures, lighting",
    icon: "Sofa",
    color: "#10B981",
    examples: ["Beds & Mattresses", "Lobby Sofas", "Lighting Fixtures", "Bathroom Vanities"],
    keywords: ["furniture", "fixture", "bed", "sofa", "light", "lamp", "mirror", "cabinet"],
  },
  {
    id: "ose",
    code: "OSE",
    label: "OS&E",
    labelAr: "المستلزمات التشغيلية",
    description: "Operating Supplies & Equipment — uniforms, stationery, key cards, consumables",
    icon: "Briefcase",
    color: "#8B5CF6",
    examples: ["Staff Uniforms", "Key Cards", "Stationery", "Office Supplies", "Name Badges"],
    keywords: ["uniform", "supply", "stationery", "office", "key card", "consumable"],
  },
  {
    id: "gra",
    code: "GRA",
    label: "Guest Amenities",
    labelAr: "لوازم غرف الضيوف",
    description: "Toiletries, slippers, robes, minibar items, and welcome amenities",
    icon: "Bath",
    color: "#EC4899",
    examples: ["Shampoo & Conditioner", "Slippers", "Bathrobes", "Minibar Snacks", "Dental Kits"],
    keywords: ["amenity", "toiletry", "shampoo", "soap", "slipper", "robe", "minibar", "guest"],
  },
  {
    id: "lin",
    code: "LIN",
    label: "Linens & Textiles",
    labelAr: "المفروشات والمنسوجات",
    description: "Bed linens, towels, bathrobes, curtains, tablecloths, and upholstery fabrics",
    icon: "Shirt",
    color: "#14B8A6",
    examples: ["Bed Sheets", "Bath Towels", "Tablecloths", "Napkins", "Curtains"],
    keywords: ["linen", "textile", "towel", "sheet", "bedding", "fabric", "curtain", "napkin"],
  },
  {
    id: "eng",
    code: "ENG",
    label: "Engineering",
    labelAr: "الهندسة والصيانة",
    description: "Engineering & Maintenance — HVAC, electrical, plumbing, tools, spare parts",
    icon: "Wrench",
    color: "#F97316",
    examples: ["HVAC Filters", "Electrical Cables", "Plumbing Fittings", "Power Tools"],
    keywords: ["engineering", "maintenance", "hvac", "electrical", "plumbing", "tool", "repair"],
  },
  {
    id: "spa",
    code: "SPA",
    label: "Spa & Recreation",
    labelAr: "السبا والترفيه",
    description: "Spa products, pool chemicals, gym equipment, sauna supplies, wellness",
    icon: "Droplets",
    color: "#06B6D4",
    examples: ["Massage Oils", "Pool Chemicals", "Gym Equipment", "Sauna Stones", "Facial Masks"],
    keywords: ["spa", "pool", "gym", "wellness", "massage", "fitness", "recreation", "swim"],
  },
  {
    id: "it",
    code: "IT",
    label: "IT & Technology",
    labelAr: "تكنولوجيا المعلومات",
    description: "TVs, WiFi equipment, POS systems, key card systems, cabling, hotel tech",
    icon: "Monitor",
    color: "#314B43",
    examples: ["Smart TVs", "WiFi Access Points", "POS Terminals", "Key Card Encoders"],
    keywords: ["it", "tech", "computer", "tv", "wifi", "network", "pos", "software"],
  },
  {
    id: "sec",
    code: "SEC",
    label: "Safety & Security",
    labelAr: "السلامة والأمن",
    description: "Fire safety, CCTV, smoke detectors, locks, safes, access control",
    icon: "Shield",
    color: "#EF4444",
    examples: ["Fire Extinguishers", "CCTV Cameras", "Smoke Detectors", "Electronic Locks"],
    keywords: ["safety", "security", "fire", "cctv", "lock", "safe", "alarm", "detector"],
  },
];

/** Short category list for tab/chip navigation (subset of full taxonomy) */
export const CATEGORY_TABS = ["All", ...HOTEL_CATEGORIES.map((c) => c.label)];

/** Lookup by id */
export function getCategoryById(id: string): HotelCategory | undefined {
  return HOTEL_CATEGORIES.find((c) => c.id === id);
}

/** Lookup by code */
export function getCategoryByCode(code: string): HotelCategory | undefined {
  return HOTEL_CATEGORIES.find((c) => c.code === code);
}

/** Get display label for a Prisma/persisted category value */
export function getCategoryLabel(categoryValue: string): string {
  // Try Prisma enum values
  const prismaMap: Record<string, string> = {
    F_AND_B: "F&B",
    CONSUMABLES: "OS&E",
    GUEST_SUPPLIES: "Guest Amenities",
    FFE: "FFE",
    SERVICES: "Engineering",
  };
  if (prismaMap[categoryValue]) return prismaMap[categoryValue];
  // Try marketplace codes
  const cat = getCategoryByCode(categoryValue);
  if (cat) return cat.label;
  // Try ids
  const byId = getCategoryById(categoryValue);
  if (byId) return byId.label;
  return categoryValue;
}

/** Map old legacy category names to new canonical ids */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "F&B": "fb",
  "Housekeeping": "hk",
  "Amenities": "gra",
  "Capital Equipment": "ffe",
  "Engineering": "eng",
  "Logistics": "eng",
  "food-beverage": "fb",
  "housekeeping": "hk",
  "amenities": "gra",
  "capital-equipment": "ffe",
  "engineering": "eng",
  "logistics": "eng",
};
