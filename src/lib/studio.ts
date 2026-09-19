import { STUDIO } from "../data/business";
import { SIZES, flavourLabel, styleById } from "../data/catalog";
import type { Celebration, Customer, LeadSource, Order, OrderStatus, PaymentMethod } from "../data/types";
import { dayKey, fmtDayShort, money, parseLocal, plural, relativeDay } from "./format";
import { orderTitle } from "./items";
import { STAGES, balanceDue, type Badge } from "./orders";

export { orderTitle } from "./items";

/* Owner-side order logic: stage labels, what to do next, the bake list and the WhatsApp messages the bakery sends. */

export const OWNER_STAGE_LABEL: Record<OrderStatus, string> = {
  request: "New request",
  quoted: "Quote sent",
  confirmed: "Paid · booked",
  baking: "Baking",
  decorating: "Decorating",
  ready: "Ready",
  collected: "Handed over",
  cancelled: "Cancelled",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = { momo: "MoMo", cash: "Cash", bank: "Bank", card: "Card" };

export const SOURCE_LABEL: Record<LeadSource, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  walkin: "Walk-in",
  referral: "Referral",
  app: "Bakery app",
};

export const IN_PRODUCTION: OrderStatus[] = ["confirmed", "baking", "decorating"];

export const isInProduction = (order: Pick<Order, "status">) => IN_PRODUCTION.includes(order.status);

/** Late = still in the kitchen after its ready date. Due today is not late yet. */
export function isLate(order: Pick<Order, "status" | "readyBy">, now: Date): boolean {
  return isInProduction(order) && order.readyBy < dayKey(now);
}

/** The owner sees the exact stage. Tones match the client badges so an order looks the same on both sides. */
export function ownerBadge(order: Pick<Order, "status" | "readyBy" | "payments" | "total">, now: Date): Badge {
  switch (order.status) {
    case "request":
      return { label: OWNER_STAGE_LABEL.request, tone: "lilac" };
    case "quoted":
      return { label: OWNER_STAGE_LABEL.quoted, tone: "sand" };
    case "ready":
      return { label: balanceDue(order) > 0 ? "Ready · owes" : "Ready", tone: balanceDue(order) > 0 ? "sand" : "berry" };
    case "collected":
      return { label: OWNER_STAGE_LABEL.collected, tone: "mist" };
    case "cancelled":
      return { label: OWNER_STAGE_LABEL.cancelled, tone: "danger" };
    default:
      return isLate(order, now) ? { label: `Late · ${OWNER_STAGE_LABEL[order.status]}`, tone: "sand" } : { label: OWNER_STAGE_LABEL[order.status], tone: "sky" };
  }
}

export function nextStage(status: OrderStatus): OrderStatus | null {
  const i = STAGES.indexOf(status);
  return i >= 0 && i < STAGES.length - 1 ? (STAGES[i + 1] ?? null) : null;
}

export type StepKind = "quote" | "payment" | "advance" | "collect";

export interface OwnerStep {
  label: string;
  kind: StepKind;
  /** For "advance": the stage the order moves to. */
  to?: Exclude<OrderStatus, "cancelled">;
}

/** The one thing an order needs from the owner next. */
export function ownerNextStep(order: Pick<Order, "status" | "payments" | "total" | "delivery">): OwnerStep | null {
  switch (order.status) {
    case "request":
      return { label: "Send quote", kind: "quote" };
    case "quoted":
      return { label: "Record payment", kind: "payment" };
    case "confirmed":
      return { label: "Start baking", kind: "advance", to: "baking" };
    case "baking":
      return { label: "Move to decorating", kind: "advance", to: "decorating" };
    case "decorating":
      return { label: "Mark ready", kind: "advance", to: "ready" };
    case "ready":
      if (balanceDue(order) > 0) return { label: "Record payment", kind: "payment" };
      return { label: order.delivery === "delivery" ? "Mark delivered" : "Mark picked up", kind: "collect" };
    default:
      return null;
  }
}

/** The date that matters for where the order is: the celebration day while it's open. */
export function ownerDateLine(order: Pick<Order, "status" | "readyBy" | "neededBy" | "history" | "delivery">, now: Date): { text: string; late: boolean } {
  const inSentence = (text: string) => (["Today", "Tomorrow", "Yesterday"].includes(text) ? text.toLowerCase() : text);
  const day = (key: string) => inSentence(relativeDay(parseLocal(key), now));
  const lastAt = (status: OrderStatus) => {
    const event = [...order.history].reverse().find((h) => h.status === status);
    return event ? inSentence(relativeDay(new Date(event.at), now)) : null;
  };
  const handover = order.delivery === "delivery" ? "Delivery" : "Pickup";
  switch (order.status) {
    case "request":
    case "quoted":
      return { text: `${handover} ${day(order.neededBy)}`, late: false };
    case "ready": {
      const since = lastAt("ready");
      return { text: since ? `Ready since ${since}` : "Ready", late: false };
    }
    case "collected":
      return { text: `${order.delivery === "delivery" ? "Delivered" : "Picked up"} ${lastAt("collected") ?? ""}`.trim(), late: false };
    case "cancelled":
      return { text: `Cancelled ${lastAt("cancelled") ?? ""}`.trim(), late: false };
    default: {
      if (isLate(order, now)) {
        const days = Math.round((parseLocal(dayKey(now)).getTime() - parseLocal(order.readyBy).getTime()) / 86_400_000);
        return { text: `Late by ${plural(days, "day")} · was due ${day(order.readyBy)}`, late: true };
      }
      return { text: `${handover} ${day(order.neededBy)}`, late: false };
    }
  }
}

/* ---------------- The bake list ---------------- */

export interface BakeLine {
  /** Groups identical bakes, e.g. "classic-cake|7 inch · Vanilla · 2 layers". */
  key: string;
  label: string;
  styleName: string;
  qty: number;
  orders: string[];
}

/**
 * What the kitchen has to make for a day's handovers: every booked order due that day, with
 * identical cakes (same item, size, flavour and layers) counted together.
 */
export function bakeList(orders: Order[], day: string): BakeLine[] {
  const lines = new Map<string, BakeLine>();
  for (const order of orders) {
    if (order.readyBy !== day || order.status === "cancelled" || order.status === "collected" || order.status === "request") continue;
    for (const item of order.items) {
      const style = styleById(item.styleId);
      const size = SIZES.find((s) => s.id === item.size)?.label;
      const parts =
        style?.kind === "cake"
          ? [size, flavourLabel(item.flavour), item.layers ? (item.layers === 1 ? "1 layer" : `${item.layers} layers`) : undefined]
          : style?.kind === "tiered"
            ? [`${item.tiers ?? 2} tiers`, flavourLabel(item.flavour)]
            : [style?.unit && /\d/.test(style.unit) ? style.unit : undefined, style?.id === "cupcakes" ? flavourLabel(item.flavour) : undefined];
      const label = parts.filter(Boolean).join(" · ");
      const key = `${item.styleId}|${label}`;
      const line = lines.get(key) ?? { key, label, styleName: style?.name ?? "Custom order", qty: 0, orders: [] };
      line.qty += item.qty;
      if (!line.orders.includes(order.number)) line.orders.push(order.number);
      lines.set(key, line);
    }
  }
  return [...lines.values()].sort((a, b) => a.styleName.localeCompare(b.styleName) || b.qty - a.qty);
}

/* ---------------- Messages ---------------- */

const firstName = (customer?: Pick<Customer, "name">) => customer?.name.split(/\s+/)[0] ?? "there";

/** The WhatsApp update for where the order is now. The owner reviews it before it opens in WhatsApp. */
export function updateMessage(order: Order, customer: Pick<Customer, "name"> | undefined, now: Date): string {
  const hi = `Hi ${firstName(customer)},`;
  const what = `your ${orderTitle(order)} (${order.number})`;
  const balance = balanceDue(order);
  const needed = parseLocal(order.neededBy);
  const rel = relativeDay(needed, now);
  const when = rel === "Today" || rel === "Tomorrow" ? rel.toLowerCase() : `on ${fmtDayShort(needed)}`;
  const handover = order.delivery === "delivery" ? "delivery" : "pickup";
  const sign = `\n\nHave a sweet day!\n${STUDIO.name}`;
  switch (order.status) {
    case "request":
      return `${hi} thank you for your order request for ${orderTitle(order)} (${order.number}). We'll send your price shortly.${sign}`;
    case "quoted":
      return `${hi} the price for ${what} is ${money(order.total)}. Full payment secures your date: pay ${money(balance)} by MoMo to ${STUDIO.phone} and send us the screenshot.${sign}`;
    case "confirmed":
      return `${hi} payment received for ${what}. You're booked for ${handover} ${when}.${sign}`;
    case "baking":
      return `${hi} ${what} is in the oven now, right on time for ${handover} ${when}.${sign}`;
    case "decorating":
      return `${hi} ${what} is being decorated. We'll message you the moment it's ready.${sign}`;
    case "ready":
      if (balance > 0) return `${hi} ${what} is ready. Your balance is ${money(balance)}, payable by MoMo before ${handover}.${sign}`;
      return order.delivery === "delivery"
        ? `${hi} ${what} is ready and leaving with our rider. They'll call when they're close. The delivery fee is paid to the rider.${sign}`
        : `${hi} ${what} is ready for pickup at ${STUDIO.area}. Please carry it flat on the car floor.${sign}`;
    case "collected":
      return `${hi} thank you for celebrating with us! We'd love a quick review of ${what}.${sign}`;
    case "cancelled":
      return `${hi} your order ${order.number} has been cancelled. Message us any time if you'd like to order again.${sign}`;
  }
}

/** A friendly nudge before a date the client asked us to remember. */
export function reminderMessage(celebration: Pick<Celebration, "label">, customer: Pick<Customer, "name"> | undefined, daysAway: number): string {
  const when = daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
  return `Hi ${firstName(customer)}, ${celebration.label} is ${when}! Would you like a cake for it? We need 3 working days' notice, so now's the perfect time to order.\n\nHave a sweet day!\n${STUDIO.name}`;
}

/** Days from today to the next time a MM-DD date comes round (0 = today). */
export function daysUntil(monthDay: string, now: Date): number {
  const [m = 1, d = 1] = monthDay.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
