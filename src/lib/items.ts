import { finishLabel, flavourLabel, sizeLabel, styleById } from "../data/catalog";
import type { OrderItem, Style } from "../data/types";
import { hasFlavour } from "./pricing";

/** "7 inch · Vanilla · 2 layers · Buttercream", "3 tiers · White-chocolate ganache", "Box of 6 · Strawberry". */
export function itemSummary(item: Pick<OrderItem, "flavour" | "size" | "layers" | "tiers" | "finish" | "design">, style: Pick<Style, "id" | "kind" | "unit"> | undefined): string {
  if (!style) return flavourLabel(item.flavour);
  const parts: string[] = [];
  if (style.kind === "cake") {
    if (item.size) parts.push(sizeLabel(item.size));
    parts.push(flavourLabel(item.flavour));
    if (item.layers) parts.push(item.layers === 1 ? "1 layer" : `${item.layers} layers`);
    parts.push(finishLabel(item.finish));
  } else if (style.kind === "tiered") {
    parts.push(`${item.tiers ?? 2} tiers`, flavourLabel(item.flavour), finishLabel(item.finish));
  } else {
    if (style.unit) parts.push(style.unit.charAt(0).toUpperCase() + style.unit.slice(1));
    if (hasFlavour(style)) parts.push(flavourLabel(item.flavour));
  }
  if (item.design === "custom" && style.kind !== "unit") parts.push("Custom design");
  return parts.join(" · ");
}

/** "Celebration cake × 2 + 1 more" */
export function orderTitle(order: { items: Pick<OrderItem, "styleId" | "qty">[] }): string {
  const first = order.items[0];
  const name = first ? (styleById(first.styleId)?.name ?? "Custom order") : "Custom order";
  const qty = first && first.qty > 1 ? ` × ${first.qty}` : "";
  const more = order.items.length > 1 ? ` + ${order.items.length - 1} more` : "";
  return `${name}${qty}${more}`;
}

/** Units in words: "2 cakes", "20 boxes", "1 loaf". */
export function unitCount(item: Pick<OrderItem, "qty">, style: Pick<Style, "kind" | "unit"> | undefined): string {
  if (!style || style.kind !== "unit" || !style.unit) return item.qty === 1 ? "1 cake" : `${item.qty} cakes`;
  const noun = style.unit.split(/[ ,]/)[0] ?? "unit";
  const many = noun.endsWith("x") ? `${noun}es` : noun.endsWith("f") ? `${noun.slice(0, -1)}ves` : `${noun}s`;
  return `${item.qty} ${item.qty === 1 ? noun : many}`;
}
