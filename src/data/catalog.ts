import type { CakeSize, CategoryId, Design, Finish, Flavour, FlavourGroup, Layers, Occasion, PriceGrid, Style } from "./types";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "celebration", label: "Celebration cakes" },
  { id: "tiered", label: "Tiered & wedding" },
  { id: "themed", label: "Themed & kids" },
  { id: "treats", label: "Cupcakes & treats" },
  { id: "pastries", label: "Pastries & small chops" },
  { id: "corporate", label: "Corporate & events" },
];

export const OCCASIONS: { id: Occasion; label: string; categories: CategoryId[] }[] = [
  { id: "birthday", label: "Birthday", categories: ["celebration", "themed", "treats"] },
  { id: "wedding", label: "Wedding", categories: ["tiered", "treats", "pastries"] },
  { id: "kids", label: "Kids' party", categories: ["themed", "treats", "pastries"] },
  { id: "christening", label: "Christening & naming", categories: ["themed", "celebration", "pastries"] },
  { id: "bridal", label: "Bridal shower", categories: ["themed", "celebration", "treats"] },
  { id: "corporate", label: "Office & events", categories: ["corporate", "pastries", "treats"] },
  { id: "anniversary", label: "Anniversary", categories: ["celebration", "tiered", "corporate"] },
  { id: "everyday", label: "Just because", categories: ["treats", "pastries", "celebration"] },
  { id: "other", label: "Something else", categories: [] },
];

export const FLAVOURS: { id: Flavour; label: string; group: FlavourGroup }[] = [
  { id: "vanilla", label: "Vanilla", group: "classic" },
  { id: "red-velvet", label: "Red velvet", group: "classic" },
  { id: "strawberry", label: "Strawberry", group: "classic" },
  { id: "chocolate", label: "Chocolate", group: "chocolate" },
];

export const FLAVOUR_GROUP_LABEL: Record<FlavourGroup, string> = {
  classic: "Red velvet, vanilla & strawberry",
  chocolate: "Chocolate",
};

export const SIZES: { id: CakeSize; label: string; short: string; serves: string }[] = [
  { id: "6", label: "6 inch", short: "6″", serves: "10–12 slices" },
  { id: "7", label: "7 inch", short: "7″", serves: "14–16 slices" },
  { id: "9", label: "9 inch", short: "9″", serves: "24–28 slices" },
  { id: "11", label: "11 inch", short: "11″", serves: "36–40 slices" },
  { id: "9x11", label: "9 × 11 inch", short: "9×11″", serves: "30–35 slices" },
  { id: "10x12", label: "10 × 12 inch", short: "10×12″", serves: "40–48 slices" },
];

export const ROUND_SIZES: CakeSize[] = ["6", "7", "9", "11"];
export const SHEET_SIZES: CakeSize[] = ["9x11", "10x12"];
export const LAYER_OPTIONS: { id: Layers; label: string }[] = [
  { id: 1, label: "Single layer" },
  { id: 2, label: "Two layers" },
  { id: 3, label: "Three layers" },
];

export const FINISH_OPTIONS: { id: Finish; label: string; hint: string }[] = [
  { id: "buttercream", label: "Buttercream", hint: "Included" },
  { id: "ganache", label: "White-chocolate ganache", hint: "Fondant-free, travels well" },
  { id: "fondant", label: "Fondant", hint: "Sharp edges, sculpted details" },
];

export const DESIGN_OPTIONS: { id: Design; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Smooth finish, piped message, your colours" },
  { id: "custom", label: "Custom or character", hint: "Theme, figures, toppers, wafer flowers" },
];

/**
 * The bakery's price list, read from its WhatsApp Business catalogue (price per cake, GH₵).
 * Only the combinations on that list are offered. The owner edits it in Menu & prices.
 */
const DEFAULT_PRICE_GRID: PriceGrid = {
  classic: {
    1: { "6": 180, "7": 230, "9": 300, "9x11": 380 },
    2: { "6": 300, "7": 320 },
    3: { "7": 350, "9": 500, "11": 600, "9x11": 700, "10x12": 750 },
  },
  chocolate: {
    1: { "6": 210, "7": 260 },
    2: { "6": 350, "7": 370, "9": 480 },
    3: { "7": 450, "9": 550, "11": 650, "9x11": 700, "10x12": 800 },
  },
};

export const cloneGrid = (grid: PriceGrid): PriceGrid => ({
  classic: { 1: { ...grid.classic[1] }, 2: { ...grid.classic[2] }, 3: { ...grid.classic[3] } },
  chocolate: { 1: { ...grid.chocolate[1] }, 2: { ...grid.chocolate[2] }, 3: { ...grid.chocolate[3] } },
});

export const defaultPriceGrid = (): PriceGrid => cloneGrid(DEFAULT_PRICE_GRID);

/** The price list every screen reads. `applyPriceGrid` keeps it in step with the store. */
export const PRICE_GRID: PriceGrid = defaultPriceGrid();

export function applyPriceGrid(grid: PriceGrid) {
  const next = cloneGrid(grid);
  PRICE_GRID.classic = next.classic;
  PRICE_GRID.chocolate = next.chocolate;
}

/**
 * Starting menu. Photos are from the bakery's Instagram (@dough_n_frost). Cake prices come from the
 * price list; the other prices are samples for the owner to confirm in Menu & prices.
 */
const DEFAULT_STYLES: Style[] = [
  { id: "classic-cake", name: "Celebration cake", category: "celebration", kind: "cake", description: "Soft sponge in red velvet, vanilla, strawberry or chocolate, one to three layers, finished with your message.", fromPrice: 0, extraFrom: 0, readyDays: 3, featured: true, tone: "blush", photo: "/photos/birthday-wafer-bloom.webp" },
  { id: "statement-cake", name: "Statement birthday cake", category: "celebration", kind: "cake", description: "Tall three-layer cake dressed with fresh fruit, gold spheres and fans in your colours.", fromPrice: 0, extraFrom: 0, sizes: ["7", "9", "11"], customDesign: true, readyDays: 3, featured: true, tone: "charcoal", photo: "/photos/birthday-blue-black.webp" },
  { id: "sheet-cake", name: "Party sheet cake", category: "celebration", kind: "cake", description: "Rectangular cake that feeds a crowd, for office parties, church events and big birthdays.", fromPrice: 0, extraFrom: 0, sizes: ["9x11", "10x12"], readyDays: 3, tone: "sand" },
  { id: "two-tier", name: "Two-tier cake", category: "tiered", kind: "tiered", description: "Two stacked tiers with fresh or sugar flowers, for milestone birthdays, engagements and intimate weddings.", fromPrice: 950, extraFrom: 0, readyDays: 5, featured: true, tone: "blush", photo: "/photos/wedding-red-roses.webp" },
  { id: "wedding-cake", name: "Wedding cake", category: "tiered", kind: "tiered", description: "Three to five tiers designed around your colours and theme, delivered and set up at the venue.", fromPrice: 2800, extraFrom: 700, readyDays: 10, featured: true, tone: "steel", photo: "/photos/wedding-emerald.webp" },
  { id: "ganache-wedding", name: "Fondant-free wedding cake", category: "tiered", kind: "tiered", description: "White-chocolate mock ganache: smooth like fondant, tastes like chocolate, sturdy enough for a destination wedding.", fromPrice: 3200, extraFrom: 800, readyDays: 10, tone: "sand", photo: "/photos/wedding-gold-roses.webp" },
  { id: "character-cake", name: "Character cake", category: "themed", kind: "cake", description: "Frozen, superheroes, cartoons or football: your child's favourite, sculpted and painted by hand.", fromPrice: 0, extraFrom: 0, customDesign: true, readyDays: 4, featured: true, tone: "sky", photo: "/photos/kids-frozen.webp" },
  { id: "christening-cake", name: "Christening & naming cake", category: "themed", kind: "cake", description: "Soft blues, pinks or whites with the baby's name, crosses, booties or a little crown.", fromPrice: 0, extraFrom: 0, customDesign: true, readyDays: 4, tone: "sky" },
  { id: "bridal-shower-cake", name: "Bridal shower cake", category: "themed", kind: "cake", description: "Pretty, playful and personal, from lingerie-box cakes to ring and bouquet designs.", fromPrice: 0, extraFrom: 0, customDesign: true, readyDays: 4, tone: "lilac" },
  { id: "cupcakes", name: "Cupcakes", category: "treats", kind: "unit", description: "Frosted cupcakes in any of our four flavours, with sprinkles or toppers in your colours.", fromPrice: 120, extraFrom: 0, unit: "box of 6", readyDays: 2, featured: true, tone: "berry" },
  { id: "fudge-loaf", name: "Chocolate fudge cake loaf", category: "treats", kind: "unit", description: "Moist chocolate poke cake soaked in fudge, topped with chocolates and wafers.", fromPrice: 150, extraFrom: 0, unit: "loaf", readyDays: 2, featured: true, tone: "charcoal", photo: "/photos/fudge-loaf.webp" },
  { id: "doughnuts", name: "Doughnuts", category: "treats", kind: "unit", description: "Soft, fluffy doughnuts, sugared or glazed.", fromPrice: 60, extraFrom: 0, unit: "pack of 6", readyDays: 1, tone: "sand" },
  { id: "rock-cakes", name: "Rock cakes", category: "treats", kind: "unit", description: "Old-school rock buns with raisins, crisp outside and soft inside.", fromPrice: 50, extraFrom: 0, unit: "pack of 10", readyDays: 1, tone: "mist" },
  { id: "small-chops", name: "Small chops platter", category: "pastries", kind: "unit", description: "Samosas, spring rolls, sausage rolls and meat pies, packed for guests to pick up and go.", fromPrice: 250, extraFrom: 0, unit: "tray for 10", readyDays: 2, featured: true, tone: "sand" },
  { id: "meat-pies", name: "Meat pies", category: "pastries", kind: "unit", description: "Buttery shortcrust filled with seasoned minced beef.", fromPrice: 90, extraFrom: 0, unit: "pack of 6", readyDays: 1, tone: "blush" },
  { id: "quiche", name: "Savoury quiche", category: "pastries", kind: "unit", description: "Golden, flaky quiche loaded with vegetables and cheese. About two hours in the oven.", fromPrice: 180, extraFrom: 0, unit: "quiche, 10 inch", readyDays: 2, tone: "sand", photo: "/photos/quiche.webp" },
  { id: "snack-box", name: "Corporate snack box", category: "corporate", kind: "unit", description: "Individually boxed pastries for meetings, launches, funerals and church programmes.", fromPrice: 55, extraFrom: 0, unit: "box", minQty: 20, readyDays: 3, featured: true, tone: "mist", photo: "/photos/small-chops.webp" },
  { id: "showpiece-cake", name: "Showpiece & logo cake", category: "corporate", kind: "tiered", description: "Sculpted cakes shaped like your building, logo or anniversary number, for churches and companies.", fromPrice: 2000, extraFrom: 600, readyDays: 10, tone: "steel", photo: "/photos/anniversary-cake.webp" },
];

/** Tier ranges for tiered items: the base price covers the smallest. */
export const TIER_RANGE: Record<string, { min: number; max: number }> = {
  "two-tier": { min: 2, max: 2 },
  "wedding-cake": { min: 3, max: 5 },
  "ganache-wedding": { min: 3, max: 5 },
  "showpiece-cake": { min: 2, max: 4 },
};

export const tierRange = (styleId: string) => TIER_RANGE[styleId] ?? { min: 2, max: 4 };

/** Unit items where the client chooses a flavour. */
export const FLAVOURED_UNITS = new Set(["cupcakes"]);

export const defaultStyles = (): Style[] => DEFAULT_STYLES.map((style) => ({ ...style, sizes: style.sizes ? [...style.sizes] : undefined }));

/** The menu clients see: every item the owner hasn't hidden. `applyStyles` keeps it in step with the store. */
export const STYLES: Style[] = defaultStyles();

/** Every item ever offered, hidden ones included, so past orders still show their name. */
const ALL_STYLES = new Map<string, Style>(STYLES.map((s) => [s.id, s]));

export function applyStyles(styles: Style[]) {
  ALL_STYLES.clear();
  for (const style of styles) ALL_STYLES.set(style.id, style);
  for (const style of DEFAULT_STYLES) if (!ALL_STYLES.has(style.id)) ALL_STYLES.set(style.id, style);
  STYLES.length = 0;
  STYLES.push(...styles.filter((s) => s.active !== false));
}

export const styleById = (id: string) => ALL_STYLES.get(id);
export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const occasionLabel = (id: Occasion) => OCCASIONS.find((o) => o.id === id)?.label ?? id;
export const flavourLabel = (id: Flavour) => FLAVOURS.find((f) => f.id === id)?.label ?? id;
export const flavourGroup = (id: Flavour): FlavourGroup => FLAVOURS.find((f) => f.id === id)?.group ?? "classic";
export const sizeLabel = (id: CakeSize) => SIZES.find((s) => s.id === id)?.label ?? id;
export const finishLabel = (id: Finish) => FINISH_OPTIONS.find((f) => f.id === id)?.label ?? id;
