'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { useCascadeEntrance } from '@/animations/cascade/useCascadeEntrance';
import { useCursorPreview } from '@/animations/cascade/useCursorPreview';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useInView } from '@/hooks/useInView';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ArrowIcon } from '@/components/ui/Icons';
import { TextReveal } from '@/components/motion/TextReveal';
import { WaterBackdrop, type BackdropVariant } from '@/components/ui/WaterBackdrop';
import { cn } from '@/lib/cn';
import type { VideoAsset } from '@/types/content';

/**
 * One row of the cascade.
 *
 * Copy is not part of the stage: `id` is the key under the message namespace,
 * so the same array serves four locales and the translators own every string.
 * Media is optional on purpose — until real footage of the plant exists, each
 * stage falls back to the generated art in `WaterBackdrop`, and the day a file
 * is delivered it is one property, not a rewrite.
 */
export type CascadeStage = {
  id: string;
  backdrop: BackdropVariant;
  poster?: string;
  posterAlt?: string;
  video?: VideoAsset;
};

/** Source → bottle. Adjacent stages never share a backdrop, or the cross-fade
    between them would look like nothing happened. */
export const JOURNEY_STAGES: CascadeStage[] = [
  { id: 'spring', backdrop: 'spring' },
  { id: 'water', backdrop: 'depth' },
  { id: 'filtration', backdrop: 'line' },
  { id: 'laboratory', backdrop: 'lab' },
  { id: 'bottling', backdrop: 'depth' },
  { id: 'product', backdrop: 'mountain' },
];

const pad = (value: number) => String(value).padStart(2, '0');

type Props = {
  stages?: CascadeStage[];
  /** Message namespace holding `eyebrow`, `title`, `lead` and one key per stage. */
  namespace?: string;
};

/**
 * The signature section of the home page: the water's route, as a stack of
 * full-bleed rows over a cinematic backdrop.
 *
 * Three states drive everything. `open` is the row the visitor chose and is the
 * only one that may be expanded; `hover` is where the cursor happens to be; the
 * *active* row is whichever of the two is more recent, falling back to the
 * first. Active decides the backdrop, the dominance of the typography and the
 * progress rail, which is why hovering explores the section without committing
 * to it and clicking commits.
 *
 * What is deliberately not here: a pinned timeline. The row heights change as
 * panels open, and pinning a section whose own height moves is how you get a
 * scroll position that fights the reader.
 */
export function JourneyCascade({
  stages = JOURNEY_STAGES,
  namespace = 'home.journey',
}: Props) {
  const t = useTranslations(namespace);
  const uid = useId();
  const tier = useDeviceTier();

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? openIndex ?? 0;

  const triggers = useRef<Array<HTMLButtonElement | null>>([]);

  const rootRef = useCascadeEntrance<HTMLElement>({ drift: tier !== 'low' });
  const [viewRef, inView] = useInView<HTMLDivElement>({ rootMargin: '300px' });
  const { areaRef, previewRef, show, hide } = useCursorPreview<
    HTMLOListElement,
    HTMLDivElement
  >();

  const toggle = useCallback(
    (index: number) => {
      setOpenIndex((current) => (current === index ? null : index));
      // An open panel is bigger than the frame trailing the cursor and says
      // more; two previews of the same stage on screen is one too many.
      hide();
    },
    [hide],
  );

  const onPointerEnter = useCallback(
    (index: number, pointerType: string) => {
      if (pointerType !== 'mouse') return;
      setHoverIndex(index);
      if (openIndex === null) show();
    },
    [openIndex, show],
  );

  /** Up and down walk the rows; Home and End jump the ends. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = stages.length - 1;
      const target =
        event.key === 'ArrowDown'
          ? Math.min(index + 1, last)
          : event.key === 'ArrowUp'
            ? Math.max(index - 1, 0)
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? last
                : null;

      if (target === null) return;
      event.preventDefault();
      triggers.current[target]?.focus();
    },
    [stages.length],
  );

  return (
    <section
      id="journey"
      ref={rootRef}
      className="relative isolate overflow-hidden bg-abyss-950 text-mist-100"
    >
      {/* --- Cinematic backdrop ------------------------------------------ */}
      <div ref={viewRef} data-cascade-backdrop data-reveal="fade" className="absolute inset-0 -z-10">
        <div data-cascade-drift className="absolute inset-0 will-change-transform">
          {/* One nudge per row, so walking down the list moves the world a
              little. Long enough to be felt rather than watched. */}
          <div
            className="absolute inset-0 transition-transform duration-[2200ms] ease-(--ease-water)"
            style={{
              transform: `translate3d(calc(var(--flow-x, 1) * ${activeIndex * 0.7}%), ${
                activeIndex * -0.9
              }%, 0)`,
            }}
          >
            {stages.map((stage, index) => (
              <StageBackdrop
                key={stage.id}
                stage={stage}
                active={index === activeIndex}
                inView={inView}
                tier={tier}
              />
            ))}
          </div>
        </div>

        {/* Readability, not decoration: the type sits on the dark end of this. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgb(3 13 24 / 0.86) 0%, rgb(3 13 24 / 0.62) 38%, rgb(3 13 24 / 0.88) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 120%, rgb(10 103 150 / 0.35) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="shell relative py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="lg:max-w-3xl">
            <div data-cascade-label data-reveal="start">
              <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
            </div>

            <TextReveal
              as="h2"
              split="lines"
              className="mt-7 font-display text-4xl leading-[1.04] text-white lg:text-6xl"
            >
              {t('title')}
            </TextReveal>

            <p
              data-cascade-lead
              data-reveal="up"
              className="mt-7 max-w-xl text-base leading-relaxed text-mist-400 lg:text-lg"
            >
              {t('lead')}
            </p>
          </div>

          {/* Progress rail. Decorative: the same position is in the list. */}
          <aside
            aria-hidden
            className="hidden lg:flex lg:flex-col lg:items-center lg:justify-between lg:gap-12 lg:self-stretch lg:ps-8"
          >
            <span className="text-2xs uppercase tracking-[0.34em] text-mist-500 [writing-mode:vertical-rl]">
              {t('stage')} {pad(activeIndex + 1)} / {pad(stages.length)}
            </span>
            <span className="relative block h-40 w-px bg-white/15">
              <span
                className="absolute inset-x-0 top-0 block bg-aqua-400 transition-[height] duration-(--duration-slow) ease-(--ease-water)"
                style={{ height: `${((activeIndex + 1) / stages.length) * 100}%` }}
              />
            </span>
          </aside>
        </div>

        {/* --- The cascade ------------------------------------------------ */}
        <ol
          ref={areaRef}
          // Safari drops list semantics from a list with no marker, and this
          // list is the structure of the section.
          role="list"
          className="relative mt-16 lg:mt-24 lg:w-[78%]"
          onPointerLeave={() => {
            setHoverIndex(null);
            hide();
          }}
          onBlur={(event) => {
            // Keyboard focus makes a row active the same way hover does, so it
            // has to release it the same way: only once focus has left the list
            // entirely, not on every hop between rows.
            if (!event.currentTarget.contains(event.relatedTarget)) setHoverIndex(null);
          }}
        >
          {stages.map((stage, index) => {
            const isOpen = openIndex === index;
            const isActive = index === activeIndex;
            const points = t.raw(`${stage.id}.points`);

            return (
              <li
                key={stage.id}
                data-cascade-row
                data-reveal="up"
                data-active={isActive}
                data-open={isOpen}
                className="group/row relative"
                onPointerEnter={(event) => onPointerEnter(index, event.pointerType)}
              >
                {/* Separator, and the aqua overline that marks the active row. */}
                <span
                  data-cascade-line
                  data-reveal="fade"
                  aria-hidden
                  className="absolute inset-x-0 top-0 block h-px bg-white/12"
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 block h-px origin-(--flow-origin) scale-x-0 bg-aqua-400 transition-transform duration-(--duration-slow) ease-(--ease-water) group-data-[active=true]/row:scale-x-100"
                />

                <h3>
                  <button
                    ref={(node) => {
                      triggers.current[index] = node;
                    }}
                    type="button"
                    id={`${uid}-trigger-${index}`}
                    aria-expanded={isOpen}
                    aria-controls={`${uid}-panel-${index}`}
                    onClick={() => toggle(index)}
                    onFocus={() => setHoverIndex(index)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                    className={cn(
                      'flex w-full items-start gap-5 py-7 text-start transition-[padding,opacity] duration-(--duration-base) ease-(--ease-water)',
                      'lg:items-center lg:gap-10 lg:py-10 lg:group-data-[active=true]/row:py-12',
                      // Everything that is not the active row recedes — but
                      // only once there is an active row to recede from.
                      'opacity-100 group-data-[active=false]/row:opacity-60',
                    )}
                  >
                    <span
                      data-cascade-number
                      data-reveal="fade"
                      className="mt-1 block w-9 shrink-0 font-display text-sm tabular text-mist-500 transition-colors duration-(--duration-base) group-data-[active=true]/row:text-aqua-300 lg:mt-0 lg:w-16 lg:text-lg"
                    >
                      {pad(index + 1)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block font-display text-[2rem] leading-[1.04] text-white transition-transform duration-(--duration-slow) ease-(--ease-water)',
                          'origin-(--flow-origin) lg:text-[3.25rem] xl:text-[4rem]',
                          'lg:group-data-[active=true]/row:scale-[1.035]',
                        )}
                      >
                        {t(`${stage.id}.title`)}
                      </span>

                      {/* The short description: always there on a phone, and on
                          a desktop it grows out of the row on hover or focus.
                          `grid-template-rows` so the height is animatable
                          without measuring anything. */}
                      <span className="mt-3 block text-sm leading-relaxed text-mist-400 lg:mt-0 lg:grid lg:grid-rows-[0fr] lg:opacity-0 lg:transition-[grid-template-rows,opacity] lg:duration-(--duration-base) lg:ease-(--ease-water) lg:group-data-[active=true]/row:mt-4 lg:group-data-[active=true]/row:grid-rows-[1fr] lg:group-data-[active=true]/row:opacity-100">
                        <span className="block max-w-xl lg:overflow-hidden">
                          {t(`${stage.id}.body`)}
                        </span>
                      </span>

                      <span className="mt-3 block text-2xs uppercase tracking-[0.28em] text-mist-500 lg:hidden">
                        {t(`${stage.id}.meta`)}
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-2xs uppercase tracking-[0.3em] text-mist-500 transition-colors duration-(--duration-base) group-data-[active=true]/row:text-mist-300 lg:block">
                      {t(`${stage.id}.meta`)}
                    </span>

                    <span
                      aria-hidden
                      className={cn(
                        'grid h-11 w-11 shrink-0 place-items-center rounded-pill border border-white/15 transition-[background-color,border-color,rotate] duration-(--duration-base) ease-(--ease-water)',
                        'group-data-[active=true]/row:border-aqua-400/50 group-data-[active=true]/row:bg-aqua-400/10',
                        'group-data-[open=true]/row:rotate-90',
                      )}
                    >
                      <ArrowIcon className="h-4 w-4 transition-[translate] duration-(--duration-base) ease-(--ease-water) group-data-[active=true]/row:[translate:calc(var(--flow-x,1)*0.3rem)_0]" />
                    </span>
                  </button>
                </h3>

                {/* --- Expanded panel ---------------------------------- */}
                <div
                  id={`${uid}-panel-${index}`}
                  role="region"
                  aria-labelledby={`${uid}-trigger-${index}`}
                  inert={!isOpen}
                  className={cn(
                    'grid transition-[grid-template-rows] duration-(--duration-slow) ease-(--ease-water)',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div
                      className={cn(
                        'grid gap-10 pb-14 transition-[opacity,transform,clip-path] duration-(--duration-slow) ease-(--ease-water)',
                        'lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:ps-24',
                        isOpen
                          ? 'translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]'
                          : 'translate-y-4 opacity-0 [clip-path:inset(0_0_100%_0)]',
                      )}
                    >
                      <div>
                        <p
                          className="max-w-2xl text-base leading-relaxed text-mist-300 transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-water) lg:text-lg"
                          style={{
                            transitionDelay: isOpen ? '120ms' : '0ms',
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen ? 'none' : 'translateY(12px)',
                          }}
                        >
                          {t(`${stage.id}.detail`)}
                        </p>

                        <ul className="mt-9 max-w-xl">
                          {(Array.isArray(points) ? (points as string[]) : []).map(
                            (point, pointIndex) => (
                              <li
                                key={point}
                                className="flex items-baseline gap-5 border-t border-white/10 py-3.5 text-sm text-mist-400 transition-[opacity,transform] duration-(--duration-slow) ease-(--ease-water)"
                                style={{
                                  transitionDelay: isOpen
                                    ? `${200 + pointIndex * 70}ms`
                                    : '0ms',
                                  opacity: isOpen ? 1 : 0,
                                  transform: isOpen ? 'none' : 'translateY(12px)',
                                }}
                              >
                                <span className="text-2xs tabular text-aqua-300/70">
                                  {pad(pointIndex + 1)}
                                </span>
                                {point}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      <figure
                        className="relative aspect-4/3 overflow-hidden rounded-md border border-white/10 transition-[opacity,transform] duration-(--duration-cinematic) ease-(--ease-water) lg:aspect-3/4"
                        style={{
                          transitionDelay: isOpen ? '160ms' : '0ms',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'none' : 'scale(1.04)',
                        }}
                      >
                        <StagePreview stage={stage} alt={t(`${stage.id}.title`)} />
                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss-950/90 to-transparent p-4 text-2xs uppercase tracking-[0.28em] text-mist-200">
                          {t(`${stage.id}.meta`)}
                        </figcaption>
                      </figure>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}

          <span aria-hidden className="absolute inset-x-0 bottom-0 block h-px bg-white/12" />
        </ol>
      </div>

      {/* --- Cursor preview ------------------------------------------------
          Fixed, transform-driven and outside the list so no row can clip it.
          Mounted only where a cursor exists; the hook keeps it invisible until
          a row is hovered and never shows it while a panel is open.

          `left-0`, not `start-0`: the hook writes viewport coordinates, and in
          an RTL document an inline-start anchor would put the frame against the
          opposite edge and send every one of those coordinates backwards. */}
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 hidden h-52 w-72 overflow-hidden rounded-md border border-white/15 opacity-0 shadow-lift lg:block"
      >
        <StagePreview
          stage={stages[activeIndex]}
          alt={t(`${stages[activeIndex].id}.title`)}
        />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss-950/90 to-transparent p-4 text-2xs uppercase tracking-[0.3em] text-white/80">
          {t(`${stages[activeIndex].id}.title`)}
        </span>
      </div>
    </section>
  );
}

/**
 * One full-bleed layer of the backdrop stack.
 *
 * All of the layers are mounted so the cross-fade has something to fade to, but
 * only the active one animates: nine SMIL paths per generated backdrop is
 * nothing, six of them running at once is not.
 */
function StageBackdrop({
  stage,
  active,
  inView,
  tier,
}: {
  stage: CascadeStage;
  active: boolean;
  inView: boolean;
  tier: 'low' | 'medium' | 'high';
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(stage.video) && tier !== 'low' && inView;
  const playing = showVideo && active;

  // Play only the layer being looked at, and only while the section is on
  // screen. `play()` rejects under a power-saving policy; the poster is then
  // what the visitor sees, which is exactly the intended fallback.
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    if (playing) element.play().catch(() => {});
    else element.pause();
  }, [playing]);

  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-[1400ms] ease-(--ease-water)',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      {stage.poster ? (
        <Image
          src={stage.poster}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
      ) : (
        <WaterBackdrop variant={stage.backdrop} animated={active && tier !== 'low'} />
      )}

      {showVideo && stage.video ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={stage.video.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        >
          {stage.video.sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      ) : null}
    </div>
  );
}

/** The still used by both the open panel and the cursor preview. */
function StagePreview({ stage, alt }: { stage: CascadeStage; alt: string }) {
  if (stage.poster) {
    return (
      <Image
        src={stage.poster}
        alt={stage.posterAlt ?? alt}
        fill
        sizes="(min-width: 1024px) 20rem, 100vw"
        className="object-cover"
      />
    );
  }

  return <WaterBackdrop variant={stage.backdrop} animated={false} />;
}
