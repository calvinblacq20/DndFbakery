import { describe, expect, it } from "vitest";
import { defaultPriceGrid, defaultStyles } from "../data/catalog";
import type { Order, Style } from "../data/types";
import { formatGhPhone, googleCalendarLink, icsFile, normalizeGhPhone, whatsappLink } from "./contact";
import { dayKey, fmtDay, fmtMonthDay, money, parseLocal, relativeDay } from "./format";
import { itemSummary, orderTitle, unitCount } from "./items";
import { badgeFor, balanceDue, canCancel, nextAction, titleFor, validatePayment } from "./orders";
import { defaultChoice, estimate, fixChoice, fromPriceOf, gridPrice, layersFor, sizesFor, unitPrice } from "./pricing";
import { amountInWords, numberToWords, orderNumber, receiptNumber, verifyCode } from "./receipts";
import { addWorkingDays, neededByFit, openStatus, readyWindow, slotsFor, type Hours } from "./schedule";

const HOURS: Hours = { 0: null, 1: ["08:00", "19:00"], 2: ["08:00", "19:00"], 3: ["08:00", "19:00"], 4: ["08:00", "19:00"], 5: ["08:00", "19:00"], 6: ["08:00", "18:00"] };
const RULES = { lateFee: 50, designFee: 150 };
const grid = defaultPriceGrid();
const menu = new Map(defaultStyles().map((s) => [s.id, s]));
const item = (id: string): Style => {
  const style = menu.get(id);
  if (!style) throw new Error(`no menu item ${id}`);
  return style;
};

describe("format", () => {
  it("formats cedis with grouping and optional pesewas", () => {
    expect(money(1500)).toBe("GH₵ 1,500");
    expect(money(12.5)).toBe("GH₵ 12.50");
    expect(money(-40)).toBe("-GH₵ 40");
  });

  it("round-trips local day keys without timezone drift", () => {
    expect(dayKey(parseLocal("2026-09-15"))).toBe("2026-09-15");
    expect(fmtDay(parseLocal("2026-09-15"))).toBe("Tue, 15 Sept 2026");
    expect(fmtMonthDay("03-14")).toBe("14 March");
  });

  it("describes nearby days relatively", () => {
    const now = parseLocal("2026-09-14T21:00");
    expect(relativeDay(parseLocal("2026-09-15"), now)).toBe("Tomorrow");
    expect(relativeDay(parseLocal("2026-09-14"), now)).toBe("Today");
    expect(relativeDay(parseLocal("2026-09-19"), now)).toBe("Sat, 19 Sept");
  });
});

describe("price list", () => {
  it("reads cake prices from the bakery's list, per flavour group", () => {
    expect(gridPrice("vanilla", 1, "6", grid)).toBe(180);
    expect(gridPrice("red-velvet", 3, "10x12", grid)).toBe(750);
    expect(gridPrice("chocolate", 3, "10x12", grid)).toBe(800);
    expect(gridPrice("chocolate", 1, "9", grid)).toBeNull();
  });

  it("only offers the sizes and layers on the list", () => {
    expect(sizesFor(item("classic-cake"), "vanilla", 2, grid)).toEqual(["6", "7"]);
    expect(sizesFor(item("classic-cake"), "chocolate", 2, grid)).toEqual(["6", "7", "9"]);
    expect(sizesFor(item("sheet-cake"), "vanilla", 3, grid)).toEqual(["9x11", "10x12"]);
    expect(layersFor(item("sheet-cake"), "chocolate", grid)).toEqual([3]);
  });

  it("adds finishes and the design fee to single cakes", () => {
    const cake = item("classic-cake");
    expect(unitPrice(cake, { flavour: "vanilla", layers: 1, size: "6", finish: "buttercream", design: "classic" }, grid, RULES)).toBe(180);
    expect(unitPrice(cake, { flavour: "chocolate", layers: 2, size: "7", finish: "fondant", design: "custom" }, grid, RULES)).toBe(370 + 120 + 150);
    // Character cakes are custom by nature, so the fee always applies.
    expect(unitPrice(item("character-cake"), { flavour: "strawberry", layers: 3, size: "9", finish: "fondant", design: "classic" }, grid, RULES)).toBe(500 + 120 + 150);
  });

  it("prices tiered cakes per tier and treats per unit", () => {
    const wedding = item("wedding-cake");
    expect(unitPrice(wedding, { flavour: "vanilla", tiers: 3, finish: "fondant", design: "custom" }, grid, RULES)).toBe(2800);
    expect(unitPrice(wedding, { flavour: "vanilla", tiers: 5, finish: "fondant", design: "custom" }, grid, RULES)).toBe(2800 + 2 * 700);
    expect(unitPrice(item("fudge-loaf"), { flavour: "vanilla", finish: "buttercream", design: "classic" }, grid, RULES)).toBe(150);
  });

  it("shows the lowest price a client can pay", () => {
    expect(fromPriceOf(item("classic-cake"), grid, RULES)).toBe(180);
    expect(fromPriceOf(item("character-cake"), grid, RULES)).toBe(330);
    expect(fromPriceOf(item("sheet-cake"), grid, RULES)).toBe(380);
    expect(fromPriceOf(item("snack-box"), grid, RULES)).toBe(55);
  });

  it("starts from a valid choice and repairs one after the flavour changes", () => {
    const cake = item("classic-cake");
    expect(defaultChoice(cake, grid)).toMatchObject({ flavour: "vanilla", layers: 1, size: "6", finish: "buttercream", design: "classic" });
    expect(defaultChoice(item("snack-box"), grid).qty).toBe(20);
    // Vanilla has no 9-inch two-layer cake, so the size falls back to one on the list.
    expect(fixChoice(cake, { qty: 1, flavour: "vanilla", layers: 2, size: "9", finish: "buttercream", design: "classic" }, grid).size).toBe("6");
    expect(fixChoice(cake, { qty: 1, flavour: "chocolate", layers: 2, size: "9", finish: "buttercream", design: "classic" }, grid).size).toBe("9");
  });

  it("adds the late-order fee once, not per item", () => {
    expect(estimate([{ unitPrice: 300, qty: 2 }, { unitPrice: 120, qty: 1 }], true, RULES)).toEqual({ subtotal: 720, lateFee: 50, total: 770 });
    expect(estimate([{ unitPrice: 300, qty: 1 }], false, RULES).lateFee).toBe(0);
    expect(estimate([{ unitPrice: 100, qty: -3 }], true, RULES).total).toBe(0);
  });
});

describe("items", () => {
  it("describes an item the way the kitchen reads it", () => {
    expect(itemSummary({ flavour: "red-velvet", size: "9", layers: 3, finish: "buttercream", design: "classic" }, item("classic-cake"))).toBe("9 inch · Red velvet · 3 layers · Buttercream");
    expect(itemSummary({ flavour: "vanilla", tiers: 4, finish: "ganache", design: "custom" }, item("wedding-cake"))).toBe("4 tiers · Vanilla · White-chocolate ganache · Custom design");
    expect(itemSummary({ flavour: "strawberry", finish: "buttercream", design: "classic" }, item("cupcakes"))).toBe("Box of 6 · Strawberry");
  });

  it("counts units in words", () => {
    expect(unitCount({ qty: 2 }, item("cupcakes"))).toBe("2 boxes");
    expect(unitCount({ qty: 1 }, item("fudge-loaf"))).toBe("1 loaf");
    expect(unitCount({ qty: 3 }, item("fudge-loaf"))).toBe("3 loaves");
    expect(orderTitle({ items: [{ styleId: "cupcakes", qty: 2 }, { styleId: "quiche", qty: 1 }] })).toBe("Cupcakes × 2 + 1 more");
  });
});

describe("schedule", () => {
  it("reports open and next opening times", () => {
    expect(openStatus(parseLocal("2026-09-15T10:00"), HOURS)).toEqual({ open: true, label: "Open · closes at 19:00" });
    expect(openStatus(parseLocal("2026-09-15T19:30"), HOURS).label).toBe("Closed · opens tomorrow at 08:00");
    expect(openStatus(parseLocal("2026-09-19T18:00"), HOURS).label).toBe("Closed · opens on Monday at 08:00");
  });

  it("returns no pickup slots on Sunday and blocks past slots", () => {
    expect(slotsFor(parseLocal("2026-09-20"), HOURS, [], parseLocal("2026-09-14T09:00"), 60, 60)).toEqual([]);
    const slots = slotsFor(parseLocal("2026-09-15"), HOURS, [], parseLocal("2026-09-15T09:10"), 60, 60);
    expect(slots[0]).toMatchObject({ time: "08:00", available: false });
    expect(slots.find((s) => s.time === "11:00")?.available).toBe(true);
    expect(slots[slots.length - 1]?.time).toBe("18:00");
  });

  it("skips Sundays when counting working days", () => {
    expect(dayKey(addWorkingDays(parseLocal("2026-09-18"), 2, HOURS))).toBe("2026-09-21");
  });

  it("treats less than the notice as a late order, and tomorrow as the earliest", () => {
    const window = readyWindow(parseLocal("2026-09-14"), 3, HOURS);
    expect(dayKey(window.normal)).toBe("2026-09-17");
    expect(neededByFit(parseLocal("2026-09-17"), window)).toBe("ok");
    expect(neededByFit(parseLocal("2026-09-15"), window)).toBe("late");
    expect(neededByFit(parseLocal("2026-09-14"), window)).toBe("too-soon");
  });
});

const baseOrder: Order = {
  id: "o1", number: "DNF-1041", customerId: "c1", createdAt: "2026-09-01T10:00:00.000Z", occasion: "birthday",
  neededBy: "2026-09-26", readyBy: "2026-09-26", items: [], designPlan: "ours", delivery: "pickup",
  status: "quoted", history: [{ status: "request", at: "2026-09-01T10:00:00.000Z" }], shortNotice: false, total: 650, payChoice: "later", payments: [],
};

describe("orders", () => {
  const now = parseLocal("2026-09-14T09:00");

  it("computes the balance from payments", () => {
    const order = { ...baseOrder, payments: [{ id: "p", amount: 400, method: "momo" as const, reference: "x", at: "", receiptNo: "", kind: "part" as const, receivedBy: "" }] };
    expect(balanceDue(order)).toBe(250);
  });

  it("allows cancelling only before baking", () => {
    expect(canCancel({ status: "confirmed" })).toBe(true);
    expect(canCancel({ status: "baking" })).toBe(false);
  });

  it("asks for full payment on quoted orders", () => {
    expect(badgeFor(baseOrder, now)).toEqual({ label: "Action required", tone: "sand" });
    expect(nextAction(baseOrder, now)?.title).toBe("Pay GH₵ 650 to book your date");
  });

  it("flags an order still in the kitchen after its day", () => {
    expect(badgeFor({ ...baseOrder, status: "decorating", readyBy: "2026-09-10" }, now).label).toBe("Running late");
    expect(badgeFor({ ...baseOrder, status: "ready", delivery: "delivery" }, now).label).toBe("Ready · balance due");
  });

  it("titles orders by pickup or delivery day", () => {
    expect(titleFor({ ...baseOrder, status: "baking", neededBy: "2026-09-15" }, now)).toBe("Pickup tomorrow");
    expect(titleFor({ ...baseOrder, delivery: "delivery" }, now)).toBe("Delivery on Sat, 26 Sept");
  });

  it("reminds about the booked pickup time", () => {
    expect(nextAction({ ...baseOrder, status: "confirmed" }, now, "2026-09-15T15:00")?.title).toBe("Pickup tomorrow at 15:00");
  });

  it("rejects zero, overpaid and cancelled payments", () => {
    expect(validatePayment(baseOrder, 0)).toBe("Enter an amount above zero.");
    expect(validatePayment(baseOrder, 2000)).toBe("That's more than the GH₵ 650 balance.");
    expect(validatePayment({ ...baseOrder, status: "cancelled" }, 10)).toMatch(/cancelled/);
    expect(validatePayment(baseOrder, 650)).toBeNull();
  });
});

describe("receipts", () => {
  it("numbers receipts and orders", () => {
    expect(receiptNumber(2026, 42)).toBe("DNFR-2026-0042");
    expect(orderNumber(1041)).toBe("DNF-1041");
  });

  it("writes amounts in words, British style", () => {
    expect(numberToWords(0)).toBe("zero");
    expect(numberToWords(105)).toBe("one hundred and five");
    expect(numberToWords(2015)).toBe("two thousand and fifteen");
    expect(numberToWords(1_250_300)).toBe("one million two hundred and fifty thousand three hundred");
    expect(amountInWords(750)).toBe("Seven hundred and fifty Ghana cedis only");
    expect(amountInWords(1)).toBe("One Ghana cedi only");
    expect(amountInWords(12.5)).toBe("Twelve Ghana cedis and fifty pesewas only");
  });

  it("produces a stable verification code that changes with the amount", () => {
    expect(verifyCode("DNFR-2026-0042", 750)).toBe(verifyCode("DNFR-2026-0042", 750));
    expect(verifyCode("DNFR-2026-0042", 750)).not.toBe(verifyCode("DNFR-2026-0042", 751));
    expect(verifyCode("DNFR-2026-0042", 750)).toMatch(/^[0-9A-F]{6}$/);
  });
});

describe("contact", () => {
  it("normalises Ghanaian phone numbers", () => {
    expect(normalizeGhPhone("054 155 2128")).toBe("233541552128");
    expect(normalizeGhPhone("+233 54 155 2128")).toBe("233541552128");
    expect(normalizeGhPhone("541552128")).toBe("233541552128");
    expect(normalizeGhPhone("12345")).toBeNull();
    expect(formatGhPhone("233541552128")).toBe("054 155 2128");
  });

  it("builds WhatsApp and calendar links", () => {
    expect(whatsappLink("0541552128", "Hi there")).toBe("https://wa.me/233541552128?text=Hi%20there");
    const event = { title: "Pickup", start: parseLocal("2026-09-17T15:00"), minutes: 30, location: "Adenta", details: "DNF-1041" };
    expect(googleCalendarLink(event)).toContain("dates=20260917T150000%2F20260917T153000");
    const ics = icsFile(event, "dnf-1", parseLocal("2026-09-14T09:00"));
    expect(ics).toContain("DTSTART;TZID=Africa/Accra:20260917T150000");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
