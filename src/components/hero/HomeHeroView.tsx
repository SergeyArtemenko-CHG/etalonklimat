"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "@/components/hero/IndustrialHero.module.css";

export type HeroCategory = {
  slug: string;
  name: string;
  description: string;
  image?: string;
};

type Tone = "light1" | "light2" | "light3" | "green" | "dark";

const LIGHT_TONES: Tone[] = ["light1", "light2", "light3"];
const CLEAR_DELAY_MS = 60;
const HOVER_SCALE = 1.28;
const HOVER_DURATION = 0.5;
const SCROLL_DURATION = 0.75;
const SKEW = -12;

const toneClass: Record<Tone, string> = {
  light1: styles.colLight1,
  light2: styles.colLight2,
  light3: styles.colLight3,
  green: styles.colGreen,
  dark: styles.colDark,
};

function toneForIndex(i: number): Tone {
  const mod = i % 5;
  if (mod === 1) return "green";
  if (mod === 3) return "dark";
  return LIGHT_TONES[i % 3];
}

function PromoStrip({ stackZ }: { stackZ: number }) {
  return (
    <div
      className={`${styles.catalogColumn} ${styles.colFixed} ${styles.colPromo}`}
      style={{ zIndex: stackZ }}
    >
      <span className={styles.colBg} aria-hidden />
      <div className={styles.promoBody}>
        <p className={styles.promoText}>
          Скидки до 45% от цен на сайте
        </p>
        <Link href="/login" className={styles.promoBtn}>
          Цены со скидкой
        </Link>
      </div>
    </div>
  );
}

function ColumnCard({
  index,
  slug,
  name,
  description,
  image,
  active,
  lifted,
  cover,
  stackZ,
  onCollapseEnd,
}: {
  index: number;
  slug: string;
  name: string;
  description: string;
  image?: string;
  active?: boolean;
  lifted?: boolean;
  cover?: boolean;
  stackZ: number;
  onCollapseEnd?: (slug: string) => void;
}) {
  const bgRef = useRef<HTMLSpanElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const tone = toneForIndex(index);
  const badge = `${String(index + 1).padStart(2, "0")} / КАТАЛОГ`;

  useEffect(() => {
    const bg = bgRef.current;
    const clip = clipRef.current;
    if (!bg || !clip) return;
    gsap.set(bg, {
      skewX: SKEW,
      scaleX: 1,
      transformOrigin: "left center",
      force3D: true,
    });
    gsap.set(clip, { width: "100%" });
  }, []);

  useEffect(() => {
    const bg = bgRef.current;
    const clip = clipRef.current;
    if (!bg || !clip) return;

    const current = Number(gsap.getProperty(bg, "scaleX")) || 1;
    const target = active ? HOVER_SCALE : 1;
    if (Math.abs(current - target) < 0.001) {
      gsap.set(clip, { width: `${target * 100}%` });
      if (!active) onCollapseEnd?.(slug);
      return;
    }

    tweenRef.current?.kill();
    const dist = Math.abs(target - current);
    const duration = HOVER_DURATION * Math.min(1, dist / (HOVER_SCALE - 1));

    gsap.set(clip, { width: `${current * 100}%` });

    const tl = gsap.timeline({
      defaults: { duration, ease: "power2.inOut", overwrite: "auto" },
      onComplete: () => {
        if (!active) onCollapseEnd?.(slug);
      },
    });
    tl.to(bg, { scaleX: target, skewX: SKEW, force3D: true }, 0);
    tl.to(clip, { width: `${target * 100}%` }, 0);
    tweenRef.current = tl;
  }, [active, slug, onCollapseEnd]);

  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  return (
    <Link
      href={`/category/${slug}`}
      data-hero-col={slug}
      className={`${styles.catalogColumn} ${toneClass[tone]}${
        active ? ` ${styles.colActive}` : ""
      }${lifted ? ` ${styles.colLifted}` : ""}${
        cover ? ` ${styles.colCover}` : ""
      }`}
      style={{ zIndex: stackZ }}
    >
      <span ref={bgRef} className={styles.colBg} aria-hidden />

      <div ref={clipRef} className={styles.columnClip}>
        {image ? (
          <div className={styles.colPhoto} aria-hidden>
            <div className={styles.colPhotoSkew}>
              <div className={styles.colPhotoUnskew}>
                <img src={image} alt="" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.columnInner}>
          <div className={styles.columnContent}>
            <span className={styles.badge}>{badge}</span>
            <div className={styles.mid}>
              <h2 className={styles.title}>{name}</h2>
              <p className={styles.description}>{description}</p>
            </div>
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomeHeroView({
  categories: cats,
}: {
  categories: HeroCategory[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  const indexBySlug = useRef(new Map<string, number>());
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [liftedSlugs, setLiftedSlugs] = useState<string[]>([]);
  /** Previous strip kept above while collapsing after L→R move */
  const [coverSlug, setCoverSlug] = useState<string | null>(null);

  useEffect(() => {
    const map = new Map<string, number>();
    cats.forEach((c, i) => map.set(c.slug, i));
    indexBySlug.current = map;
  }, [cats]);

  const cancelClear = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const unlift = useCallback((slug: string) => {
    setLiftedSlugs((prev) => prev.filter((s) => s !== slug));
    setCoverSlug((prev) => (prev === slug ? null : prev));
  }, []);

  const setActive = useCallback(
    (slug: string | null) => {
      cancelClear();
      if (activeRef.current === slug) return;
      const prev = activeRef.current;
      activeRef.current = slug;

      if (slug && prev) {
        const pi = indexBySlug.current.get(prev);
        const ni = indexBySlug.current.get(slug);
        // Moving left→right: keep prev on top so its overhang
        // retracts instead of flashing the new strip’s left edge.
        if (pi != null && ni != null && ni > pi) {
          setCoverSlug(prev);
        } else {
          setCoverSlug(null);
        }
      } else if (!slug) {
        setCoverSlug(null);
      } else {
        setCoverSlug(null);
      }

      if (slug) {
        setLiftedSlugs((prevLifted) =>
          prevLifted.includes(slug) ? prevLifted : [...prevLifted, slug]
        );
      }
      setActiveSlug(slug);
    },
    [cancelClear]
  );

  const scheduleClear = useCallback(() => {
    cancelClear();
    clearTimerRef.current = setTimeout(() => {
      activeRef.current = null;
      setActiveSlug(null);
      setCoverSlug(null);
      clearTimerRef.current = null;
    }, CLEAR_DELAY_MS);
  }, [cancelClear]);

  const slugFromPoint = useCallback((x: number, y: number) => {
    const track = trackRef.current;
    if (!track) return null;
    const el = document.elementFromPoint(x, y);
    if (!el || !track.contains(el)) return null;
    return el.closest("[data-hero-col]")?.getAttribute("data-hero-col") ?? null;
  }, []);

  const onTrackPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const slug = slugFromPoint(e.clientX, e.clientY);
      if (slug) {
        setActive(slug);
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (
        el &&
        trackRef.current?.contains(el) &&
        el.closest(`.${styles.colPromo}`)
      ) {
        scheduleClear();
      }
    },
    [setActive, slugFromPoint, scheduleClear]
  );

  const onTrackPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const related = e.relatedTarget;
      if (related instanceof Node && trackRef.current?.contains(related)) return;
      scheduleClear();
    },
    [scheduleClear]
  );

  useEffect(() => () => {
    cancelClear();
    scrollTweenRef.current?.kill();
  }, [cancelClear]);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollNext(false);
      setCanScrollPrev(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, cats.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const delta = dir * el.clientWidth * 0.45;
    const target = Math.max(0, Math.min(max, el.scrollLeft + delta));
    scrollTweenRef.current?.kill();
    scrollTweenRef.current = gsap.to(el, {
      scrollLeft: target,
      duration: SCROLL_DURATION,
      ease: "power2.inOut",
      overwrite: "auto",
      onUpdate: updateScrollState,
      onComplete: updateScrollState,
    });
  };

  if (!cats.length) return null;

  // +1 for the promo strip on the left
  const n = cats.length + 1;
  const Z_GAP = 10;
  const idleZ = (i: number) => (n - i) * Z_GAP;

  const stripZ = (trackIndex: number, slug?: string) => {
    const idle = idleZ(trackIndex);
    if (trackIndex === 0 || !slug) return idle;
    if (coverSlug === slug) return idle + 3;
    if (activeSlug === slug) return idle + 2;
    if (liftedSlugs.includes(slug)) return idle + 1;
    return idle;
  };

  return (
    <section
      className={styles.hero}
      aria-label="Каталог промышленного оборудования"
    >
      <div className={styles.skewWrapper}>
        <div className={styles.stage}>
          <div ref={scrollerRef} className={styles.scroller}>
            <div
              ref={trackRef}
              className={styles.track}
              onPointerMove={onTrackPointerMove}
              onPointerLeave={onTrackPointerLeave}
            >
              <PromoStrip stackZ={stripZ(0)} />
              {cats.map((cat, i) => (
                <ColumnCard
                  key={cat.slug}
                  index={i}
                  slug={cat.slug}
                  name={cat.name}
                  description={cat.description}
                  image={cat.image}
                  active={activeSlug === cat.slug}
                  lifted={liftedSlugs.includes(cat.slug)}
                  cover={coverSlug === cat.slug}
                  stackZ={stripZ(i + 1, cat.slug)}
                  onCollapseEnd={unlift}
                />
              ))}
              {/* Spacer so the last skewed strip’s text stays fully in view */}
              <div
                className={styles.colSpacer}
                aria-hidden
                style={{ zIndex: 0 }}
              >
                <span className={styles.colSpacerBg} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {canScrollPrev ? (
        <button
          type="button"
          className={styles.navPrev}
          onClick={() => scrollByPage(-1)}
          aria-label="Показать предыдущие категории"
        >
          <span aria-hidden>←</span>
        </button>
      ) : null}

      {canScrollNext ? (
        <button
          type="button"
          className={styles.navNext}
          onClick={() => scrollByPage(1)}
          aria-label="Показать следующие категории"
        >
          <span aria-hidden>→</span>
        </button>
      ) : null}
    </section>
  );
}
