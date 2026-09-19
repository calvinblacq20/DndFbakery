import { CakeSlice, CalendarCheck, Check, Palette, Truck } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Photo } from "../../components/Bits";
import { Reveal } from "../../components/Reveal";
import { motionMode } from "../../motion";

interface Step {
  eyebrow: string;
  icon: ReactNode;
  title: string;
  body: string;
  check: string;
  photo: string;
  alt: string;
  position: string;
  float: { label: string; value: string; note: string };
}

const STEPS: Step[] = [
  {
    eyebrow: "Step 1 · Choose",
    icon: <CakeSlice size={14} />,
    title: "Pick your cake and the day you need it.",
    body: "Celebration, wedding and character cakes, cupcakes and small chops. Cake prices come straight from our price list, and we need three working days' notice.",
    check: "Prices shown up front",
    photo: "/photos/birthday-wafer-bloom.webp",
    alt: "White birthday cake with wafer-paper flowers",
    position: "center 40%",
    float: { label: "Pickup", value: "Sat, 26 Sept", note: "Birthday · 15:00" },
  },
  {
    eyebrow: "Step 2 · Design",
    icon: <Palette size={14} />,
    title: "Tell us your theme. We'll do the rest.",
    body: "Send a picture, describe the colours and names, or book a design and tasting session for your wedding cake.",
    check: "Your design confirmed on WhatsApp",
    photo: "/photos/kids-frozen.webp",
    alt: "Elsa and Anna Frozen character cakes",
    position: "center 40%",
    float: { label: "Design", value: "Frozen", note: "Elsa and Anna · blue and silver" },
  },
  {
    eyebrow: "Step 3 · Bake",
    icon: <CalendarCheck size={14} />,
    title: "Baked fresh for your date.",
    body: "Full payment locks in your day. We bake the day before and decorate close to pickup, and you can follow every stage in the app.",
    check: "Updates on WhatsApp at each stage",
    photo: "/photos/wedding-emerald-detail.webp",
    alt: "Close-up of an emerald and marble wedding cake with white roses",
    position: "center 35%",
    float: { label: "Progress", value: "Decorating", note: "Pickup tomorrow, 15:00" },
  },
  {
    eyebrow: "Step 4 · Celebrate",
    icon: <Truck size={14} />,
    title: "Pick up in Adenta or get it delivered.",
    body: "Collect at your time slot or have it delivered across Accra; wedding cakes travel anywhere in Ghana. Every payment gets an official receipt.",
    check: "Official receipt for every payment",
    photo: "/photos/wedding-reception.webp",
    alt: "A Dough n Frost wedding cake and cupcake tower at a reception",
    position: "center 45%",
    float: { label: "Receipt", value: "GH₵ 770", note: "Paid · MoMo" },
  },
];

/** Pinned feature cards that stack as you scroll, each sliding up over the last. */
export function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-title">
      <div className="how-head">
        <Reveal as="h2" look="focus" id="how-title" className="t-h2">
          How ordering works
        </Reveal>
        <Reveal as="p" look="focus" delay={0.08} className="muted">
          From the first message to the first slice.
        </Reveal>
      </div>
      <div className="stack-list">
        {STEPS.map((step, i) => (
          <StackCard key={step.title} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function StackCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLElement>(null);
  // Calm keeps the text brightening (opacity) and drops the photo zoom and the floating card's drift.
  const mode = motionMode();
  // Progress as this card rises from the bottom of the screen to its pinned position.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const textOpacity = useTransform(scrollYProgress, [0.35, 1], [0.32, 1]);
  const floatY = useTransform(scrollYProgress, [0, 1], [70, 0]);
  const floatRotate = useTransform(scrollYProgress, [0, 1], [index % 2 ? -6 : 6, 0]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);

  // The CSS pins tall cards lower (see .stack-card), which needs the card's rendered height.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => el.style.setProperty("--card-h", `${el.offsetHeight}px`));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={ref} className={`stack-card ${index % 2 ? "is-flipped" : ""}`} style={{ zIndex: index + 1 }}>
      <motion.div className="stack-text" style={mode === "off" ? undefined : { opacity: textOpacity }}>
        <span className="chip-soft">
          {step.icon}
          {step.eyebrow}
        </span>
        <h3 className="stack-title">{step.title}</h3>
        <p className="muted">{step.body}</p>
        <p className="stack-check">
          <Check size={15} /> {step.check}
        </p>
      </motion.div>
      <div className="stack-media">
        <motion.div className="stack-photo" style={mode === "full" ? { scale: photoScale } : undefined}>
          <Photo tone="mist" src={step.photo} alt={step.alt} position={step.position} sizes="(min-width: 1024px) 600px, 100vw" height="100%" radius={0} />
        </motion.div>
        <motion.div className="float-card" style={mode === "full" ? { y: floatY, rotate: floatRotate } : undefined}>
          <span className="subtle t-cap">{step.float.label}</span>
          <strong>{step.float.value}</strong>
          <span className="t-cap muted">{step.float.note}</span>
        </motion.div>
      </div>
    </article>
  );
}
