import { addDays, dayKey, localIso, startOfDay } from "../lib/format";
import { defaultChoice, estimate, fixChoice, layersFor, sizesFor, unitPrice } from "../lib/pricing";
import { addWorkingDays, isOpenDay } from "../lib/schedule";
import { HOURS } from "./business";
import { FLAVOURED_UNITS, OCCASIONS, STYLES, tierRange } from "./catalog";
import type { Appointment, Celebration, Customer, Delivery, Design, Finish, Flavour, LeadSource, Occasion, Order, OrderItem, OrderStatus, Payment, PaymentMethod, Review, Style } from "./types";

/**
 * The bakery's own book for the demo: every client and order the owner sees on the admin side.
 * Orders are simulated day by day over five months, so each order's stage today follows from its own
 * dates (quoted, paid, baking, decorating, ready, handed over). Fixed seeds keep it the same on every reset.
 */

type Rng = ReturnType<typeof random>;

/** Small deterministic random generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const chance = (p: number) => next() < p;
  function pick<T>(items: readonly T[]): T {
    return items[Math.floor(next() * items.length)] as T;
  }
  function weighted<T>(items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let roll = next() * total;
    for (const [item, weight] of items) {
      roll -= weight;
      if (roll < 0) return item;
    }
    return (items[items.length - 1] as readonly [T, number])[0];
  }
  return { next, int, chance, pick, weighted };
}

interface ClientSeed {
  name: string;
  phone: string;
  town: string;
  source: LeadSource;
  notes?: string;
  dietary?: string;
}

const CLIENTS: ClientSeed[] = [
  { name: "Adwoa Asante", phone: "024 318 7702", town: "Adenta", source: "instagram", notes: "Twins Kofi and Kafui: one cake, two names, every March. Prefers red velvet.\nPays on MoMo the same day she orders." },
  { name: "Esi Boateng", phone: "055 902 1147", town: "East Legon", source: "whatsapp", notes: "Office admin at a bank in Airport City. Snack boxes for board meetings, usually 30 to 40. Pays by bank transfer and needs the receipt for accounts." },
  { name: "Kwame Mensah", phone: "020 664 3391", town: "Madina", source: "referral", notes: "Surprise cakes for his wife. Deliver to her office in Madina and call HIS number, never hers." },
  { name: "Akua Owusu", phone: "027 455 8830", town: "Ashaley Botwe", source: "walkin" },
  { name: "Naa Adjeley Tetteh", phone: "054 771 2098", town: "Teshie", source: "instagram", notes: "Wedding planner. Sends three or four wedding cake couples a month; agreed 5% planner discount. Wants venue setup photos for her page." },
  { name: "Yaw Darko", phone: "024 190 6655", town: "Dodowa", source: "whatsapp" },
  { name: "Abigail Osei", phone: "050 233 4417", town: "Oyarifa", source: "instagram", dietary: "Nut allergy: no nuts or nut toppings." },
  { name: "Selasi Agbeko", phone: "026 812 0934", town: "Spintex", source: "referral", notes: "Referred by Esi Boateng. Likes minimal, all-white designs." },
  { name: "Efua Quaye", phone: "055 347 6612", town: "Tema", source: "instagram", notes: "Delivery to the Community 25 junction; the rider calls her from there." },
  { name: "Mawuli Ampofo", phone: "024 604 5578", town: "Adenta", source: "walkin" },
  { name: "Priscilla Nyarko", phone: "059 118 2240", town: "Haatso", source: "instagram", notes: "Leads the women's fellowship at her church. Sheet cakes for anniversaries and harvest." },
  { name: "Daniel Larbi", phone: "020 997 3316", town: "Kwabenya", source: "whatsapp" },
  { name: "Gifty Appiah", phone: "027 239 8804", town: "Adenta", source: "referral", notes: "Loves the fudge loaf. Buys two most Fridays." },
  { name: "Rita Amoah", phone: "054 480 1126", town: "Dome", source: "instagram" },
  { name: "Michael Sarpong", phone: "024 755 9031", town: "Pantang", source: "walkin" },
  { name: "Linda Frimpong", phone: "055 620 4478", town: "Madina", source: "instagram", dietary: "Eggless, please (vegetarian)." },
  { name: "Ama Serwaa Kyei", phone: "026 301 7765", town: "Ashongman", source: "whatsapp", notes: "Head of a Montessori school in Ashongman. End-of-term cupcakes for about 60 pupils." },
  { name: "Joyce Addo", phone: "050 874 2201", town: "Oyarifa", source: "instagram" },
  { name: "Kojo Antwi", phone: "024 426 3358", town: "Kumasi", source: "instagram", notes: "Orders from Kumasi for his mum. Pays online, delivery to Adenta Housing Down." },
  { name: "Beatrice Aidoo", phone: "057 112 9047", town: "Adenta", source: "walkin" },
  { name: "Emmanuel Ofori", phone: "020 558 6613", town: "East Legon", source: "referral" },
  { name: "Patience Badu", phone: "024 963 0182", town: "Frafraha", source: "whatsapp" },
  { name: "Dzifa Kumah", phone: "055 781 3390", town: "Adenta", source: "instagram" },
  { name: "Samuel Acquah", phone: "027 646 1259", town: "Tema", source: "instagram" },
  { name: "Comfort Ansah", phone: "054 207 8836", town: "Abokobi", source: "walkin" },
  { name: "Nana Ama Agyeman", phone: "024 872 4403", town: "Legon", source: "whatsapp" },
  { name: "Edem Mensah", phone: "059 330 7721", town: "Adenta", source: "app" },
  { name: "Josephine Asamoah", phone: "050 419 5584", town: "Madina", source: "app" },
];

const STYLE_WEIGHTS: [string, number][] = [
  ["classic-cake", 24], ["statement-cake", 8], ["sheet-cake", 5], ["two-tier", 5], ["wedding-cake", 3], ["ganache-wedding", 2],
  ["character-cake", 10], ["christening-cake", 4], ["bridal-shower-cake", 3], ["cupcakes", 10], ["fudge-loaf", 8], ["doughnuts", 5],
  ["rock-cakes", 3], ["small-chops", 7], ["meat-pies", 5], ["quiche", 3], ["snack-box", 5], ["showpiece-cake", 1],
];

const FLAVOUR_WEIGHTS: [Flavour, number][] = [["vanilla", 30], ["red-velvet", 32], ["chocolate", 28], ["strawberry", 10]];
const FINISH_WEIGHTS: [Finish, number][] = [["buttercream", 80], ["ganache", 12], ["fondant", 8]];
const METHOD_WEIGHTS: [PaymentMethod, number][] = [["momo", 64], ["cash", 16], ["bank", 12], ["card", 8]];

/** How many of each unit item people usually buy. */
const UNIT_QTY: Record<string, [number, number]> = {
  cupcakes: [1, 4], "fudge-loaf": [1, 2], doughnuts: [1, 4], "rock-cakes": [1, 3], "small-chops": [1, 5], "meat-pies": [1, 5], quiche: [1, 2], "snack-box": [20, 60],
};

const DESIGN_NOTES = [
  "Pink and gold, 'Happy 30th Ama' on top.",
  "Frozen theme, Elsa figure, name: Maame Esi, turning 5.",
  "All white with fresh roses, simple and elegant.",
  "Chelsea colours and a football, for my husband's 40th.",
  "Baby blue, little booties, name: Nhyira.",
  "Black and gold, drip on the side, gold spheres.",
  "Company logo on top, blue and white.",
];

const HISTORY_DAYS = 150;

export interface StudioBook {
  customers: Customer[];
  orders: Order[];
  celebrations: Celebration[];
  appointments: Appointment[];
  reviews: Review[];
}

export function createStudioBook(now: Date, rnd = random(20260918)): StudioBook {
  const today = startOfDay(now);
  const nowMs = now.getTime();
  const at = (offset: number, hour: number, minute = 0) => {
    const d = addDays(today, offset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  /** A working-hours time on a past day, never later than a few minutes ago. */
  const timeOn = (r: Rng, offset: number, notBefore = 0, hours: [number, number] = [8, 17]) =>
    Math.max(notBefore, Math.min(at(offset, r.int(hours[0], hours[1]), r.pick([0, 10, 20, 30, 40, 50])).getTime(), nowMs - 20 * 60_000));
  const daysFromToday = (d: Date) => Math.round((startOfDay(d).getTime() - today.getTime()) / 86_400_000);
  const openFrom = (offset: number, step: 1 | -1) => {
    let o = offset;
    while (!isOpenDay(addDays(today, o), HOURS)) o += step;
    return o;
  };

  const customers: Customer[] = CLIENTS.map((c, i) => ({
    id: `c-${String(i + 1).padStart(2, "0")}`,
    name: c.name,
    phone: c.phone,
    email: `${c.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@gmail.com`,
    town: c.town,
    memberSince: at(-rnd.int(160, 700), 10).toISOString(),
    hasAccount: c.source === "app" || rnd.chance(0.25),
    points: rnd.int(0, 30) * 10,
    source: c.source,
    notes: c.notes,
    dietary: c.dietary,
  }));
  const clientId = (index: number) => (customers[index] ?? customers[0])!.id;
  const styleFor = (id: string): Style => STYLES.find((s) => s.id === id) ?? STYLES[0]!;

  const payment = (r: Rng, amount: number, time: number, kind: Payment["kind"], phone: string): Payment => {
    const method = r.weighted(METHOD_WEIGHTS);
    const digits = String(r.int(10_000_000, 99_999_999));
    return {
      id: "",
      amount,
      method,
      reference: method === "momo" ? `MTN ${digits}` : method === "bank" ? `GCB ${digits}` : method === "card" ? `PSK-${digits}` : "Cash",
      at: new Date(time).toISOString(),
      receiptNo: "",
      kind,
      receivedBy: method === "card" ? "Paystack (online)" : "Dough n Frost",
      payer: method === "momo" ? `MTN MoMo · ${phone}` : undefined,
    };
  };

  /** One item as a client would choose it. */
  const makeItem = (r: Rng, style: Style, id: string): OrderItem => {
    const flavour = r.weighted(FLAVOUR_WEIGHTS);
    let choice = { ...defaultChoice(style), flavour };
    if (style.kind === "cake") {
      const layers = r.pick(layersFor(style, flavour));
      choice = fixChoice(style, { ...choice, layers, size: r.pick(sizesFor(style, flavour, layers)) });
      choice.finish = r.weighted(FINISH_WEIGHTS);
      choice.design = style.customDesign || r.chance(0.25) ? "custom" : "classic";
      choice.qty = r.chance(0.05) ? 2 : 1;
    } else if (style.kind === "tiered") {
      const { min, max } = tierRange(style.id);
      choice.tiers = r.int(min, max);
      choice.finish = style.id === "ganache-wedding" ? "ganache" : r.weighted([["buttercream", 50], ["fondant", 30], ["ganache", 20]] as const);
      choice.design = "custom" as Design;
    } else {
      const [lo, hi] = UNIT_QTY[style.id] ?? [1, 3];
      choice.qty = Math.max(style.minQty ?? 1, r.int(lo, hi));
      if (!FLAVOURED_UNITS.has(style.id)) choice.flavour = "vanilla";
    }
    const message = style.kind !== "unit" && r.chance(0.7) ? r.pick(["Happy Birthday!", "Happy 30th", "Congratulations", "Happy Anniversary", "God bless you"]) : undefined;
    return { id, styleId: style.id, ...choice, message, unitPrice: unitPrice(style, choice) };
  };

  const orders: Order[] = [];

  /** One order placed `offset` days ago, carried forward along its own timeline to today. */
  const simulate = (r: Rng, offset: number, seq: number, opts: { awaitingQuote?: boolean; hold?: "quoted"; style?: string; due?: number; sameDay?: boolean } = {}) => {
    const style = styleFor(opts.style ?? r.weighted(STYLE_WEIGHTS));
    const customerIndex = r.chance(0.55) ? r.int(0, 13) : r.int(0, CLIENTS.length - 1);
    const phone = CLIENTS[customerIndex]?.phone ?? "";
    const n = String(seq).padStart(3, "0");
    const items = [makeItem(r, style, `i-s${n}`)];
    // Cakes often come with something for the guests.
    if (style.kind !== "unit" && r.chance(0.18)) items.push(makeItem(r, styleFor(r.pick(["cupcakes", "small-chops", "meat-pies", "doughnuts"])), `i-s${n}b`));

    const createdAt = timeOn(r, offset);
    const notice = Math.max(...items.map((i) => styleFor(i.styleId).readyDays));
    const short = opts.due === undefined && r.chance(0.08) && notice > 1;
    const lead = short ? r.int(1, notice - 1) : style.kind === "tiered" ? notice + r.int(5, 40) : notice + r.int(0, 10);
    const planned = opts.due === undefined ? addWorkingDays(new Date(createdAt), lead, HOURS) : addDays(today, openFrom(opts.due, 1));
    const dueOffset = daysFromToday(planned);
    const shortNotice = short || (opts.due !== undefined && dueOffset - offset < notice);
    const total = estimate(items, shortNotice).total;
    const occasions = OCCASIONS.filter((o) => o.categories.includes(style.category)).map((o) => o.id);
    const occasion: Occasion = occasions.length ? r.pick(occasions) : "everyday";
    const custom = items.some((i) => i.design === "custom") || style.kind === "tiered";

    // The order's timeline in days from today. Anything after today hasn't happened yet.
    const quotedAt = opts.awaitingQuote ? 1 : offset + (custom ? r.weighted([[0, 5], [1, 3]] as const) : 0);
    const cancelled = !opts.hold && !opts.due && r.chance(0.04);
    const wentQuiet = !opts.hold && !opts.due && !cancelled && custom && r.chance(0.08);
    const paidAt = opts.hold === "quoted" ? dueOffset + 1 : Math.min(quotedAt + r.weighted([[0, 6], [1, 3], [2, 1]] as const), Math.max(quotedAt, dueOffset - 1));
    // Cakes bake and get decorated on the last open day before the handover (Saturday for a Monday); tiers take a day longer.
    const dayBefore = openFrom(dueOffset - 1, -1);
    // Afternoon pickups are often decorated the same morning.
    const sameDay = style.kind === "cake" && (opts.sameDay ?? r.chance(0.35));
    const bakeAt = style.kind === "unit" ? dueOffset : style.kind === "tiered" ? openFrom(dayBefore - 1, -1) : dayBefore;
    const decorateAt = style.kind === "unit" ? null : sameDay ? dueOffset : dayBefore;
    const handedAt = dueOffset + (r.chance(0.06) ? 1 : 0);

    const plan: [OrderStatus, number][] = [["request", offset], ["quoted", quotedAt]];
    if (cancelled) plan.push(["cancelled", quotedAt + r.int(0, 2)]);
    else if (wentQuiet) plan.push(["cancelled", quotedAt + 7]); // an unpaid quote is closed after a week
    else plan.push(["confirmed", paidAt], ["baking", Math.max(bakeAt, paidAt)], ...(decorateAt === null ? [] : [["decorating", Math.max(decorateAt, paidAt)] as [OrderStatus, number]]), ["ready", dueOffset], ["collected", handedAt]);

    // Each step has its hours: baking in the morning, decorating in the afternoon, handovers from late morning.
    const WINDOW: Partial<Record<OrderStatus, [number, number]>> = sameDay
      ? { baking: [7, 11], decorating: [7, 9], ready: [12, 14], collected: [14, 17] }
      : { baking: [7, 11], decorating: [12, 17], ready: [7, 10], collected: [11, 17] };
    const history: { status: OrderStatus; at: string; time: number }[] = [];
    let last = 0;
    for (const [status, day] of plan) {
      if (day > 0) break;
      const time = history.length === 0 ? createdAt : Math.max(last + 20 * 60_000, at(day, r.int(...(WINDOW[status] ?? [8, 17])), r.pick([0, 15, 30, 45])).getTime());
      // Steps later today haven't happened yet: a cake due tomorrow may still be in the oven this morning.
      if (history.length > 0 && time > nowMs - 10 * 60_000) break;
      last = time;
      history.push({ status, at: new Date(time).toISOString(), time });
    }
    const status = history[history.length - 1]!.status;
    const timeOf = (s: OrderStatus) => history.find((h) => h.status === s)?.time;

    const payments: Payment[] = [];
    const paidTime = timeOf("confirmed");
    if (paidTime !== undefined) {
      const part = r.chance(0.12);
      const first = part ? Math.round(total / 20) * 10 : total;
      payments.push(payment(r, first, paidTime, part ? "part" : "full", phone));
      const settleTime = timeOf("collected") ?? (status === "ready" ? timeOf("ready") : undefined);
      if (part && settleTime !== undefined) payments.push(payment(r, total - first, settleTime, "final", phone));
    }

    const delivery: Delivery = style.kind === "tiered" || (style.id === "snack-box" && r.chance(0.7)) || r.chance(0.3) ? "delivery" : "pickup";
    orders.push({
      id: `o-s${n}`,
      number: "",
      customerId: clientId(customerIndex),
      createdAt: new Date(createdAt).toISOString(),
      occasion,
      neededBy: dayKey(planned),
      readyBy: dayKey(planned),
      items,
      designPlan: style.kind === "tiered" ? "consult" : custom ? r.pick(["photo", "photo", "ours"] as const) : "ours",
      designNotes: custom ? r.pick(DESIGN_NOTES) : undefined,
      delivery,
      deliveryTown: delivery === "delivery" ? CLIENTS[customerIndex]?.town : undefined,
      status,
      history: history.map(({ status: s, at: t }) => ({ status: s, at: t })),
      shortNotice,
      total,
      payChoice: "later",
      payments,
      lastUpdateAt: status === "request" ? undefined : history[history.length - 1]?.at,
    });
  };

  let seq = 0;
  for (let offset = -HISTORY_DAYS; offset <= 0; offset++) {
    if (!isOpenDay(addDays(today, offset), HOURS)) continue;
    // Each day draws from its own seed, so the book doesn't shift with the weekday the demo is opened on.
    const r = random(20260918 + (offset + 1000) * 7919);
    const busy = 0.72 + (0.26 * (offset + HISTORY_DAYS)) / HISTORY_DAYS; // a little busier each month
    const count = r.chance(busy) ? 1 + (r.chance(0.6) ? 1 : 0) + (r.chance(0.25) ? 1 : 0) : 0;
    for (let i = 0; i < count; i++) simulate(r, offset, ++seq);
    // Requests from the last two days that still need a price, so there's always something to quote.
    if (offset >= -1) simulate(r, offset, ++seq, { awaitingQuote: true, style: offset === 0 ? "character-cake" : "wedding-cake" });
  }
  // Whatever the date: a quote waiting for payment, and a full kitchen today and tomorrow.
  simulate(random(4242), -2, ++seq, { hold: "quoted", style: "statement-cake" });
  const soon: [number, string, number][] = [
    [0, "statement-cake", -6], [0, "classic-cake", -5], [0, "cupcakes", -3], [0, "snack-box", -5],
    [1, "character-cake", -5], [1, "classic-cake", -4], [1, "fudge-loaf", -2], [1, "small-chops", -3],
    [2, "two-tier", -9], [2, "classic-cake", -3],
  ];
  // The first cake due today is decorated this morning, so there's always one on the decorating table.
  soon.forEach(([due, style, placed], i) => simulate(random(5100 + i), placed, ++seq, { due, style, sameDay: i === 0 ? true : undefined }));

  // Handover slots for the coming week, plus tastings and design consultations.
  const appointments: Appointment[] = [];
  const upcoming = orders
    .filter((o) => ["confirmed", "baking", "decorating", "ready"].includes(o.status) && o.neededBy >= dayKey(today) && o.neededBy <= dayKey(addDays(today, 7)))
    .sort((a, b) => a.neededBy.localeCompare(b.neededBy));
  upcoming.forEach((order, i) => {
    const r = random(6100 + i);
    const [y, m, d] = order.neededBy.split("-").map(Number);
    const start = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, r.int(10, 17), r.pick([0, 30]));
    appointments.push({ id: `a-h${String(i + 1).padStart(2, "0")}`, customerId: order.customerId, orderId: order.id, purpose: order.delivery === "delivery" ? "delivery" : "pickup", start: localIso(start), minutes: order.delivery === "delivery" ? 60 : 30, status: r.chance(0.8) ? "confirmed" : "requested" });
    order.appointmentId = appointments[appointments.length - 1]!.id;
  });
  const requests = orders.filter((o) => o.status === "request");
  const appt = (id: string, order: Order | undefined, customerIndex: number, purpose: Appointment["purpose"], offset: number, hour: number, minute: number, status: Appointment["status"]) => {
    appointments.push({ id, customerId: order?.customerId ?? clientId(customerIndex), orderId: order?.id, purpose, start: localIso(at(offset, hour, minute)), minutes: purpose === "consultation" ? 45 : 30, status });
  };
  if (isOpenDay(today, HOURS)) appt("a-t01", requests.find((o) => o.items.some((i) => i.styleId === "wedding-cake")), 4, "tasting", 0, 11, 0, "confirmed");
  appt("a-t02", undefined, 7, "consultation", openFrom(1, 1), 15, 0, "requested");
  appt("a-t03", undefined, 20, "tasting", openFrom(3, 1), 12, 0, "confirmed");
  appt("a-t04", undefined, 25, "consultation", openFrom(5, 1), 10, 0, "requested");
  appt("a-t05", undefined, 3, "tasting", openFrom(-3, -1), 11, 0, "done");

  // Dates clients asked the bakery to remember: some coming up soon, so reminders have something to show.
  const monthDay = (offset: number) => {
    const d = addDays(today, offset);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const celebrations: Celebration[] = [
    { id: "d-s01", customerId: clientId(0), label: "Kofi and Kafui's birthday", date: monthDay(3), remind: true },
    { id: "d-s02", customerId: clientId(2), label: "His wife's birthday", date: monthDay(6), remind: true },
    { id: "d-s03", customerId: clientId(10), label: "Fellowship anniversary", date: monthDay(10), remind: true },
    { id: "d-s04", customerId: clientId(18), label: "His mum's birthday", date: monthDay(13), remind: true },
    { id: "d-s05", customerId: clientId(12), label: "Her daughter's birthday", date: monthDay(24), remind: true },
    { id: "d-s06", customerId: clientId(7), label: "Wedding anniversary", date: monthDay(52), remind: true },
    { id: "d-s07", customerId: clientId(16), label: "End of term", date: monthDay(71), remind: false },
    { id: "d-s08", customerId: clientId(5), label: "Birthday", date: monthDay(140), remind: true },
  ];

  const reviews: Review[] = [
    { id: "r-s1", name: "Adwoa A.", rating: 5, text: "Kofi and Kafui's cake was perfect again. Two names, one cake, zero fights. Moist red velvet as always.", at: at(-1, 19).toISOString(), styleId: "classic-cake", customerId: clientId(0), status: "pending" },
    { id: "r-s2", name: "Esi B.", rating: 4, text: "Snack boxes were neat and the board loved the sausage rolls. Delivery came 20 minutes after the time we agreed.", at: at(-2, 13).toISOString(), styleId: "snack-box", customerId: clientId(1), status: "pending" },
    { id: "r-s3", name: "Abigail O.", rating: 5, text: "They remembered my nut allergy without me repeating it. The cupcakes were beautiful.", at: at(-4, 10).toISOString(), styleId: "cupcakes", customerId: clientId(6), status: "pending" },
    { id: "r-s4", name: "Unknown", rating: 1, text: "Wrong bakery, sorry, meant to review another shop.", at: at(-6, 21).toISOString(), styleId: "classic-cake", status: "hidden" },
  ];

  return { customers, orders, celebrations, appointments, reviews };
}
