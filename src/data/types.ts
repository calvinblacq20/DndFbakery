export type ID = string;

export type Occasion = "birthday" | "wedding" | "kids" | "christening" | "bridal" | "corporate" | "anniversary" | "everyday" | "other";

export type CategoryId = "celebration" | "tiered" | "themed" | "treats" | "pastries" | "corporate";

/** Pastel tile colours behind photos and fallbacks (see .photo.tone-* in ui.css). */
export type Tone = "lilac" | "sky" | "sand" | "blush" | "steel" | "mist" | "berry" | "charcoal";

/**
 * How a menu item is priced.
 * cake: from the price list, by flavour, layers and size.
 * tiered: a base price for two tiers plus a price per extra tier.
 * unit: a fixed price per box, pack or loaf.
 */
export type PriceKind = "cake" | "tiered" | "unit";

export type Flavour = "vanilla" | "red-velvet" | "strawberry" | "chocolate";
/** The price list has two columns: red velvet, vanilla and strawberry share one; chocolate has its own. */
export type FlavourGroup = "classic" | "chocolate";
export type CakeSize = "6" | "7" | "9" | "11" | "9x11" | "10x12";
export type Layers = 1 | 2 | 3;
/** Buttercream is included; white-chocolate mock ganache is the fondant-free finish brides ask for. */
export type Finish = "buttercream" | "ganache" | "fondant";
/** Classic: piped message and simple colours. Custom: theme, characters, toppers, wafer flowers (extra charge). */
export type Design = "classic" | "custom";

/** Price per cake: group → layers → size. Missing sizes aren't offered in that combination. */
export type PriceGrid = Record<FlavourGroup, Record<Layers, Partial<Record<CakeSize, number>>>>;

export interface Style {
  id: ID;
  name: string;
  category: CategoryId;
  description: string;
  kind: PriceKind;
  /** tiered: price for two tiers. unit: price per unit. cake: unused (the price list decides). */
  fromPrice: number;
  /** tiered: each tier above two. Others: 0. */
  extraFrom: number;
  /** unit items: what one unit is, e.g. "box of 6". */
  unit?: string;
  /** unit items with a minimum order, e.g. 20 snack boxes. */
  minQty?: number;
  /** cake items: the sizes on offer. Defaults to the round sizes. */
  sizes?: CakeSize[];
  /** Themed items are custom by nature, so the design charge always applies. */
  customDesign?: boolean;
  /** Working days of notice needed; shorter notice is a late order. */
  readyDays: number;
  featured?: boolean;
  /** False hides the item from clients. Past orders keep showing it. */
  active?: boolean;
  tone: Tone;
  /** Optional real photo in /public/photos. */
  photo?: string;
}

export interface OrderItem {
  id: ID;
  styleId: ID;
  qty: number;
  flavour: Flavour;
  /** cake items */
  size?: CakeSize;
  layers?: Layers;
  /** tiered items */
  tiers?: number;
  finish: Finish;
  design: Design;
  /** Writing on the cake, e.g. "Happy 30th Ama". */
  message?: string;
  unitPrice: number;
}

export type OrderStatus =
  | "request"
  | "quoted"
  | "confirmed"
  | "baking"
  | "decorating"
  | "ready"
  | "collected"
  | "cancelled";

/** ours: we design from your notes. photo: you send an inspiration photo. consult: a design and tasting session first. */
export type DesignPlan = "ours" | "photo" | "consult";
export type Delivery = "pickup" | "delivery";
export type PaymentMethod = "momo" | "card" | "cash" | "bank";
/** "now": paid in full online at checkout (the bakery's policy). "later": design request first, pay once the quote is confirmed. */
export type PayChoice = "now" | "later";

export interface StatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Payment {
  id: ID;
  amount: number;
  method: PaymentMethod;
  reference: string;
  at: string;
  receiptNo: string;
  kind: "full" | "part" | "final";
  receivedBy: string;
  /** Who or what paid, e.g. "MTN MoMo · 054 155 2128". */
  payer?: string;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID;
  createdAt: string;
  occasion: Occasion;
  /** The celebration day: when the order is picked up or delivered. Day key, YYYY-MM-DD. */
  neededBy: string;
  /** When it has to be finished. Day key, YYYY-MM-DD (usually the same day). */
  readyBy: string;
  items: OrderItem[];
  designPlan: DesignPlan;
  /** Theme, colours, names and ages for the decorator. */
  designNotes?: string;
  /** The pickup or delivery slot, and any design consultation. */
  appointmentId?: ID;
  delivery: Delivery;
  deliveryTown?: string;
  comments?: string;
  status: OrderStatus;
  history: StatusEvent[];
  /** Placed with less notice than the menu needs: the late-order fee applies. */
  shortNotice: boolean;
  total: number;
  payChoice: PayChoice;
  payments: Payment[];
  /** When the bakery last sent the client a WhatsApp update about this order. */
  lastUpdateAt?: string;
}

/** A date a client wants remembered, so the bakery can remind them to order in time. */
export interface Celebration {
  id: ID;
  customerId: ID;
  /** "Ama's birthday", "Our anniversary". */
  label: string;
  /** Month and day, MM-DD. */
  date: string;
  /** Set when the client wants a WhatsApp reminder a week before. */
  remind: boolean;
  /** When the bakery last sent the reminder, so it isn't sent twice in a year. */
  remindedAt?: string;
}

export type AppointmentPurpose = "pickup" | "delivery" | "tasting" | "consultation";

export interface Appointment {
  id: ID;
  customerId: ID;
  orderId?: ID;
  purpose: AppointmentPurpose;
  /** Local ISO date-time, YYYY-MM-DDTHH:mm. */
  start: string;
  minutes: number;
  status: "requested" | "confirmed" | "cancelled" | "done";
}

/** How a client first found the bakery. */
export type LeadSource = "instagram" | "whatsapp" | "walkin" | "referral" | "app";

/**
 * Everyone who has ordered, with or without an account. Records are matched by
 * WhatsApp number, so repeat guest orders land on one customer.
 */
export interface Customer {
  id: ID;
  name: string;
  phone: string;
  email: string;
  town: string;
  /** Street or landmark, for deliveries. */
  address?: string;
  /** GhanaPost GPS address, e.g. GA-123-4567. */
  digitalAddress?: string;
  memberSince: string;
  /** True once they confirmed their WhatsApp number with a code. Accounts are optional. */
  hasAccount: boolean;
  points: number;
  source?: LeadSource;
  /** What the client tells the kitchen: allergies, eggless, no nuts, less sugar. Shown to both sides. */
  dietary?: string;
  /** The owner's notebook: favourite flavours, family names, delivery quirks. Never shown to the client. */
  notes?: string;
}

/** What the customer types at checkout. */
export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
  town: string;
  address: string;
  digitalAddress: string;
}

export type ReviewStatus = "pending" | "published" | "hidden";

export interface Review {
  id: ID;
  name: string;
  rating: number;
  text: string;
  at: string;
  styleId: ID;
  customerId?: ID;
  /** Only published reviews appear on the bakery page. */
  status: ReviewStatus;
  reply?: string;
}
