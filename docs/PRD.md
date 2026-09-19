# Dough n Frost: Bakery App (Demo) PRD

## Goal
Make Em's daily work easier and give clients a simple way to order, pay for and follow their cake. One app with two sides, sharing the same data. It is the same system as the Franz Qlodin tailoring build, retuned for a bakery.

## The business
Everything below comes from their WhatsApp Business profile (`brand/source-video/IMG_3100.MP4`, a screen recording) and their Instagram, as seen on 18–19 Sept 2026.

| | |
|---|---|
| Name | Dough n Frost ("Cakes by Em" on Instagram); owner Em |
| What they make | Homemade celebration cakes, pies, doughnuts, rock cakes and pastries "for special occasions, everyday treats, or just because" |
| Menu seen | Celebration cakes by size and layers, two-tier, wedding (incl. fondant-free white-chocolate mock ganache, wafer-paper flowers, Adinkra), baby christening, bridal shower, children's themed (Frozen), cupcakes, pastries, corporate packages, chocolate fudge loaf, quiche, cake classes |
| Address | 25 Agyemang Avenue, Adenta, Accra |
| Phone and WhatsApp | +233 54 155 2128 · wa.me/message/NNP6QAVDBVKDP1 |
| Email | doughnfrost@gmail.com |
| Instagram | [@dough_n_frost](https://www.instagram.com/dough_n_frost/): 1,242 followers, 467 posts |
| Facebook | "dough_n_frost", 98 likes; the page isn't public, so no link yet |
| WhatsApp Business since | November 2019 |
| Hours (WhatsApp) | Mon–Fri 08:00–19:00 · Sat 08:00–18:00 · Sun closed |
| Rules (Instagram bio and catalogue) | Minimum 3 working days' notice before the delivery day · 100% payment secures the order · "NO DMs" (order on WhatsApp) · GH₵ 50 extra on all late orders · custom and character cakes cost at least GH₵ 150 extra |
| Tagline in captions | "Have a sweet day!", "Every cake has a story", "We travel across Ghana for your big day!" |

### Price list (from the WhatsApp catalogue, GH₵ per cake)

| Red velvet, vanilla, strawberry | 6″ | 7″ | 9″ | 11″ | 9×11″ | 10×12″ |
|---|---|---|---|---|---|---|
| Single layer | 180 | 230 | 300 | – | 380 | – |
| Two layers | 300 | 320 | – | – | – | – |
| Three layers | – | 350 | 500 | 600 | 700 | 750 |

| Chocolate | 6″ | 7″ | 9″ | 11″ | 9×11″ | 10×12″ |
|---|---|---|---|---|---|---|
| Single layer | 210 | 260 | – | – | – | – |
| Two layers | 350 | 370 | 480 | – | – | – |
| Three layers | – | 450 | 550 | 650 | 700 | 800 |

The list was read from a low-resolution screen recording. The three-layer 7″ red velvet/vanilla price (350) was the hardest to read. The owner can correct any cell in **Menu & prices**.

## Who
- **Clients:** parents ordering birthday and character cakes, couples and wedding planners, offices ordering snack boxes, churches ordering anniversary cakes. They arrive from Instagram or WhatsApp on a phone.
- **Owner:** Em, baking and decorating in a home kitchen, working from her phone.

## Stage
Clickable demo using sample data stored in the browser. Paystack payments, WhatsApp codes and logins are simulated: no money moves and no messages are sent.

## Design
The Franz Qlodin system (Makro look, Fresha structure; see `docs/design-reference.md`, `docs/structure-reference.md`, `docs/admin-ui-guidelines.md`) in Dough n Frost colours: cocoa ink on warm cream with frosting pink as the one accent. The mark is a frosted doughnut (there's no logo on their profile yet).

## Client side
| Screen | Job |
|---|---|
| Home | Gallery of their cakes, about, menu, how ordering works, reviews, hours, good to know, map, WhatsApp and Instagram |
| Explore | The whole menu, filtered by occasion, searchable, with saved favourites |
| Order | Menu → customise (flavour, layers, size, finish, design, message; quantity for treats) → day, pickup time or delivery window, design session if wanted → your details and allergies → review and pay. No account needed. |
| Pay | Pay in full now (Paystack: Mobile Money or card), or send the request and pay once the price is confirmed. Price-list cakes paid online are booked straight away; custom designs wait for the owner's quote. |
| Track | Orders on this phone; "Find my order" with order number + WhatsApp number + code; pickups and sessions; receipts |
| Dates to remember | Birthdays and anniversaries the client saves for a WhatsApp reminder a week before, plus allergies for the kitchen (needs an account) |
| Account (optional) | WhatsApp number + code, no password |

## Owner side (`#/admin`)
| Screen | Job |
|---|---|
| Today | Kitchen list for today and the next working day (identical cakes counted together), trends, what's in the kitchen, the next 14 days, today's pickups and sessions, birthday reminders to send, orders ready to hand over, requests waiting for a price |
| Orders | List and board by stage, filters in the URL, one quick action per order |
| Order | Stage stepper, money and receipts, items, allergies, design notes and cake messages, pickup slot, WhatsApp updates |
| New order | Walk-in or WhatsApp orders with the same menu options, late-order detection and payment |
| Clients | Spend, unpaid, source; profile with orders, dates to remember (send reminder), allergies, a private notebook and payments |
| Pickups & tastings | Calendar of pickups, deliveries, tastings and design sessions; confirm, decline, remind |
| Payments, Reports, Reviews | As in the tailor build |
| Menu & prices | Editable cake price list grid, and per-item prices, notice, visibility and featuring |
| Settings | Bakery details (incl. email, Instagram, Facebook), hours, fees (late order, design), policies, reset demo |

## Data model
- **Customer:** name, WhatsApp number (the matching key), email, town, address and GhanaPost address, account flag, points, lead source (Instagram / WhatsApp / walk-in / referral / app), allergies and dietary needs (both sides), owner's notebook (owner only)
- **Celebration:** customer, label, month-day, remind flag, when the reminder was last sent
- **Order:** number, customer, occasion, handover day, items, design plan (we design / client's picture / design session) and notes, pickup or delivery, pay choice, status history, short-notice flag, total, payments
- **Order item:** menu item, quantity, flavour, size and layers (cakes) or tiers (tiered cakes), finish, design, message on the cake, unit price
- **Payment:** amount, method, payer, Paystack reference, receipt number, kind (full / part / final)
- **Appointment:** pickup, delivery, tasting or design session; time; status; linked order
- **Menu item:** name, category, price kind (price list / tiered / per unit), price, extra per tier, unit, minimum quantity, notice in working days, visibility
- **Price grid:** flavour group × layers × size → price; blank = not offered
- **Rules:** late-order fee, design fee

Order stages: `request → quoted → confirmed (paid) → baking → decorating → ready → collected` (or `cancelled`).

## Edge cases
- Less notice than the item needs: the day is marked "Late" and the late-order fee is added once per order. The next working day is the earliest; Sundays are closed.
- A size isn't on the price list for that flavour and layer count: it's shown but disabled, and changing flavour or layers moves the size to one that is offered.
- Snack boxes have a minimum of 20.
- Payments can't exceed what's owed.
- Paying in full online for a price-list cake books it (confirmed); paying for a custom design keeps it a request until the owner quotes, and the quote then books it.
- The same WhatsApp number orders again as a guest: one customer record, allergies kept.
- An order link opened on another phone: hidden until the order number, WhatsApp number and code match.
- A reminder isn't offered twice within a month.

## Open questions for the owner
1. Confirm the price list, especially the three-layer 7″ red velvet/vanilla price.
2. Prices for items not on the list are samples: two-tier (GH₵ 950), wedding cakes (from GH₵ 2,800 + GH₵ 700 per extra tier), fondant-free wedding (from GH₵ 3,200), showpiece (from GH₵ 2,000), cupcakes (GH₵ 120 per 6), doughnuts, rock cakes, meat pies, small chops, quiche, snack boxes (GH₵ 55, min 20). Ganache (+GH₵ 100) and fondant (+GH₵ 120) extras are samples too.
3. Hours: WhatsApp says 08:00–19:00, the Instagram bio says 8am–5pm.
4. Notice for wedding cakes (demo uses 10 working days) and two-tier cakes (5).
5. Delivery: fee by distance paid to the rider, or a fixed zone price?
6. Cake classes: dates and prices, and whether to add bookings for them.
7. The Facebook page link, and a logo if they have one.
8. Who takes orders on WhatsApp besides Em, and on what phone.

## Going live with Paystack
- The app starts the payment with the public key; the secret key lives only on the server.
- An order is marked paid only after the server verifies the transaction (Paystack verify API or a webhook with a checked signature), and the verified amount and currency (GHS) match what's due.
- The Paystack reference (`DNF1042-XXXXXX`) is unique per attempt, so a repeated webhook can't record a payment twice.
- Receipts are numbered on the server after verification.

## Out of scope (demo)
Real authentication, live Paystack and WhatsApp (need the server above), sending reminders automatically, ingredient stock, cake-class bookings, multi-staff roles.

## Decision log
| Decision | Alternatives | Why |
|---|---|---|
| Copy the Franz Qlodin system and retune it | Build from scratch | Calvin asked for the same system; the structure is proven |
| Full payment secures the order | 50% deposit like the tailor | It's the bakery's own rule |
| Cake prices from a grid, not a "from" price | One starting price per cake | Their price list is flavour × layers × size |
| Late-order fee, flat GH₵ 50 | 20% rush | Their catalogue: "50 cedis on all late orders" |
| Measurements become dates to remember and allergies | Drop the screen | Birthdays repeat every year; reminders bring repeat orders |
| Fittings become pickup and delivery slots | Day only | Cakes can't wait on a counter; the kitchen plans by time |
| Pink "frosting" accent on cocoa ink | Keep lime | Their price list and brand are pink; different brand colours were asked for |
| Real photos from their Instagram | Stock photos | Calvin approved downloading them on 19 Sept 2026 |
