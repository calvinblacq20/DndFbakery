import type { Hours } from "../lib/schedule";

/** In code the bakery is "the studio" (the cake studio), so the two builds share one vocabulary. */
export interface StudioDetails {
  name: string;
  tagline: string;
  category: string;
  about: string;
  area: string;
  address: string;
  directions: string;
  mapsQuery: string;
  phone: string;
  email: string;
  whatsappBusiness: string;
  instagram: string;
  /** Left empty until the owner confirms the page link. */
  facebook: string;
  owner: string;
  rating: number;
  reviewCount: number;
}

export interface Policies {
  cancellation: string;
  payment: string;
  handover: string;
  important: string;
}

/** Money rules from the bakery's own notices. */
export interface Rules {
  /** Added to orders placed with less notice than the menu needs ("50 cedis on all late orders"). */
  lateFee: number;
  /** Minimum extra for custom and character designs. */
  designFee: number;
}

/** Everything the owner can change in Settings. */
export interface StudioSettings {
  studio: StudioDetails;
  hours: Hours;
  policies: Policies;
  rules: Rules;
}

const DEFAULT_STUDIO: StudioDetails = {
  name: "Dough n Frost",
  tagline: "Celebration cakes & pastries",
  category: "Home bakery · Cakes & pastries",
  about:
    "Dough n Frost is Em's home bakery in Adenta. We bake homemade celebration cakes, pies, doughnuts, rock cakes and pastries for special occasions, everyday treats, or just because. From a child's Frozen birthday to a four-tier Adinkra wedding cake and boxed small chops for the office, everything is baked to order in our kitchen, and wedding cakes travel anywhere in Ghana.",
  area: "Agyemang Avenue, Adenta",
  address: "25 Agyemang Avenue, Adenta, Accra, Ghana",
  directions: "25 Agyemang Avenue, Adenta. Call or WhatsApp when you arrive and we'll bring your order out.",
  mapsQuery: "25 Agyemang Avenue, Adenta, Ghana",
  phone: "054 155 2128",
  email: "doughnfrost@gmail.com",
  whatsappBusiness: "https://wa.me/message/NNP6QAVDBVKDP1",
  instagram: "https://www.instagram.com/dough_n_frost/",
  facebook: "",
  owner: "Em",
  /** Sample figures for the demo. */
  rating: 4.9,
  reviewCount: 86,
};

/** Hours from the bakery's WhatsApp Business profile. */
const DEFAULT_HOURS: Hours = {
  0: null,
  1: ["08:00", "19:00"],
  2: ["08:00", "19:00"],
  3: ["08:00", "19:00"],
  4: ["08:00", "19:00"],
  5: ["08:00", "19:00"],
  6: ["08:00", "18:00"],
};

const DEFAULT_POLICIES: Policies = {
  cancellation: "Cancel free of charge until baking starts, usually the day before your date. After that, your payment covers the ingredients and work already done.",
  payment: "Full payment secures your order. Custom and wedding designs get a quote first, and baking is booked once it's paid.",
  handover: "Pick up at 25 Agyemang Avenue, Adenta, at your chosen time. Deliveries across Accra are paid to the rider on arrival. Carry cakes flat on the car floor, never on a lap.",
  important: "We need at least 3 working days' notice before your date. Tell us about allergies when you order: our kitchen uses eggs, milk, wheat and nuts.",
};

const DEFAULT_RULES: Rules = { lateFee: 50, designFee: 150 };

export const cloneSettings = (settings: StudioSettings): StudioSettings => ({
  studio: { ...settings.studio },
  hours: { ...settings.hours },
  policies: { ...settings.policies },
  rules: { ...settings.rules },
});

export const defaultSettings = (): StudioSettings => cloneSettings({ studio: DEFAULT_STUDIO, hours: DEFAULT_HOURS, policies: DEFAULT_POLICIES, rules: DEFAULT_RULES });

/**
 * The bakery details every screen reads. The saved settings in the store are the source of truth:
 * `applySettings` copies them in here whenever they change, so both sides show the same details
 * without every screen having to subscribe to the store.
 */
export const STUDIO: StudioDetails = { ...DEFAULT_STUDIO };
export const HOURS: Hours = { ...DEFAULT_HOURS };
export const POLICIES: Policies = { ...DEFAULT_POLICIES };
export const RULES: Rules = { ...DEFAULT_RULES };

export function applySettings(settings: StudioSettings) {
  Object.assign(STUDIO, settings.studio);
  Object.assign(POLICIES, settings.policies);
  Object.assign(RULES, settings.rules);
  for (let day = 0; day < 7; day++) HOURS[day] = settings.hours[day] ?? null;
}

/** Real cakes from @dough_n_frost on Instagram, for the hero gallery. */
export const STUDIO_PHOTOS = [
  { src: "/photos/wedding-emerald.webp", alt: "Three-tier emerald and marble wedding cake with white roses and gold leaf", position: "center 35%" },
  { src: "/photos/wedding-gold-roses.webp", alt: "Three-tier white and gold wedding cake with red and white roses", position: "center 40%" },
  { src: "/photos/kids-frozen.webp", alt: "Elsa and Anna Frozen character cakes", position: "center 40%" },
  { src: "/photos/wedding-adinkra.webp", alt: "Four-tier Adinkra wedding cake with the Gye Nyame symbol", position: "center 40%" },
  { src: "/photos/birthday-wafer-bloom.webp", alt: "White birthday cake with wafer-paper flowers and a gold topper", position: "center 40%" },
  { src: "/photos/wedding-red-roses.webp", alt: "Two-tier white wedding cake with red roses and a Mr and Mrs topper", position: "center 35%" },
] as const;

export const OCCASION_PHOTOS: Record<string, string> = {
  birthday: "/photos/birthday-blue-black.webp",
  wedding: "/photos/wedding-emerald-detail.webp",
  kids: "/photos/kids-frozen.webp",
  christening: "/photos/birthday-wafer-bloom.webp",
  bridal: "/photos/wedding-red-roses.webp",
  corporate: "/photos/anniversary-cake.webp",
  anniversary: "/photos/wedding-adinkra-side.webp",
  everyday: "/photos/fudge-loaf.webp",
};

export const STUDIO_FEATURES = [
  { icon: "truck", label: "Delivery across Accra; wedding cakes anywhere in Ghana" },
  { icon: "calendar", label: "3 working days' notice; late orders cost GH₵ 50 extra" },
  { icon: "cake", label: "Fondant-free white-chocolate ganache on request" },
  { icon: "users", label: "Corporate snack boxes from 20 boxes" },
  { icon: "wallet", label: "MoMo, card, cash and bank transfer" },
  { icon: "school", label: "Cake classes: ask us for the next date" },
] as const;
