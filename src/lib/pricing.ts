import { RULES, type Rules } from "../data/business";
import { FLAVOURED_UNITS, FLAVOURS, LAYER_OPTIONS, PRICE_GRID, ROUND_SIZES, flavourGroup, tierRange } from "../data/catalog";
import type { CakeSize, Design, Finish, Flavour, Layers, OrderItem, PriceGrid, Style } from "../data/types";

/** Sample extras for special finishes on single cakes; tiered cakes include the finish in their price. */
export const FINISH_ADD: Record<Finish, number> = { buttercream: 0, ganache: 100, fondant: 120 };

/** What the customer picks for one menu item. */
export type ItemChoice = Pick<OrderItem, "styleId" | "qty" | "flavour" | "size" | "layers" | "tiers" | "finish" | "design" | "message">;

/** A cake's price from the list, or null when that combination isn't offered. */
export function gridPrice(flavour: Flavour, layers: Layers, size: CakeSize, grid: PriceGrid = PRICE_GRID): number | null {
  return grid[flavourGroup(flavour)][layers][size] ?? null;
}

export const sizesOf = (style: Pick<Style, "sizes">): CakeSize[] => style.sizes ?? ROUND_SIZES;

/** Sizes on offer for this item in a flavour and layer count. */
export function sizesFor(style: Pick<Style, "sizes">, flavour: Flavour, layers: Layers, grid: PriceGrid = PRICE_GRID): CakeSize[] {
  return sizesOf(style).filter((size) => gridPrice(flavour, layers, size, grid) !== null);
}

/** Layer counts with at least one size on offer. */
export function layersFor(style: Pick<Style, "sizes">, flavour: Flavour, grid: PriceGrid = PRICE_GRID): Layers[] {
  return LAYER_OPTIONS.map((l) => l.id).filter((layers) => sizesFor(style, flavour, layers, grid).length > 0);
}

const designCharge = (style: Pick<Style, "customDesign">, design: Design, rules: Rules) => (style.customDesign || design === "custom" ? rules.designFee : 0);

/** Price of one unit of an item as chosen. Custom designs add the design fee on single cakes. */
export function unitPrice(style: Style, choice: Omit<ItemChoice, "styleId" | "qty">, grid: PriceGrid = PRICE_GRID, rules: Rules = RULES): number {
  switch (style.kind) {
    case "cake": {
      const base = choice.layers && choice.size ? gridPrice(choice.flavour, choice.layers, choice.size, grid) : null;
      return (base ?? 0) + FINISH_ADD[choice.finish] + designCharge(style, choice.design, rules);
    }
    case "tiered": {
      const { min } = tierRange(style.id);
      return style.fromPrice + Math.max(0, (choice.tiers ?? min) - min) * style.extraFrom;
    }
    case "unit":
      return style.fromPrice;
  }
}

/** The lowest price a client can pay for an item, for "from GH₵ …" labels. */
export function fromPriceOf(style: Style, grid: PriceGrid = PRICE_GRID, rules: Rules = RULES): number {
  if (style.kind !== "cake") return style.fromPrice;
  const prices = FLAVOURS.flatMap((f) => LAYER_OPTIONS.flatMap((l) => sizesOf(style).map((size) => gridPrice(f.id, l.id, size, grid)))).filter((p): p is number => p !== null);
  return (prices.length ? Math.min(...prices) : 0) + (style.customDesign ? rules.designFee : 0);
}

/** A sensible first choice for an item: vanilla, the smallest size on offer, buttercream. */
export function defaultChoice(style: Style, grid: PriceGrid = PRICE_GRID): Omit<ItemChoice, "styleId"> {
  const qty = style.minQty ?? 1;
  const base = { qty, flavour: "vanilla" as Flavour, finish: style.id === "ganache-wedding" ? ("ganache" as Finish) : ("buttercream" as Finish), design: style.customDesign ? ("custom" as Design) : ("classic" as Design) };
  if (style.kind === "cake") {
    const layers = layersFor(style, "vanilla", grid)[0] ?? 1;
    return { ...base, layers, size: sizesFor(style, "vanilla", layers, grid)[0] };
  }
  if (style.kind === "tiered") return { ...base, tiers: tierRange(style.id).min };
  return base;
}

/** Whether the customer picks a flavour for this item. */
export const hasFlavour = (style: Pick<Style, "id" | "kind">) => style.kind !== "unit" || FLAVOURED_UNITS.has(style.id);

/** Keeps a choice valid after the flavour or layers change: sizes not on offer fall back to the nearest one that is. */
export function fixChoice(style: Style, choice: Omit<ItemChoice, "styleId">, grid: PriceGrid = PRICE_GRID): Omit<ItemChoice, "styleId"> {
  if (style.kind !== "cake") return choice;
  const layerOptions = layersFor(style, choice.flavour, grid);
  const layers = choice.layers && layerOptions.includes(choice.layers) ? choice.layers : (layerOptions[0] ?? 1);
  const sizes = sizesFor(style, choice.flavour, layers, grid);
  const size = choice.size && sizes.includes(choice.size) ? choice.size : (sizes[0] ?? choice.size);
  return { ...choice, layers, size };
}

export interface Estimate {
  subtotal: number;
  lateFee: number;
  total: number;
}

export function estimate(lines: { unitPrice: number; qty: number }[], shortNotice: boolean, rules: Rules = RULES): Estimate {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * Math.max(0, line.qty), 0);
  const lateFee = shortNotice && subtotal > 0 ? rules.lateFee : 0;
  return { subtotal, lateFee, total: subtotal + lateFee };
}
