'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { cn } from '@/lib/cn';
import type { VideoAsset } from '@/types/content';
import { WaterBackdrop, type BackdropVariant } from './WaterBackdrop';

// The 3D bundle is the single heaviest thing on the site. It must never be part
// of the initial chunk, and it must never render on the server.
const BottleScene = dynamic(() => import('@/components/three/BottleScene'), {
  ssr: false,
});

type MediaLayerProps = {
  /** Real photography, once it exists. Falls back to generated art. */
  poster?: string;
  posterAlt?: string;
  backdrop?: BackdropVariant;
  video?: VideoAsset;
  /** Mount the WebGL scene on high-tier devices. */
  scene?: boolean;
  className?: string;
  priority?: boolean;
};

/**
 * The progressive-enhancement ladder from the architecture:
 *
 *     3D  →  video  →  static image
 *
 * Only one rung is ever mounted. `useDeviceTier` decides which, so a weak
 * laptop is never asked to composite a WebGL canvas behind a video behind an
 * image — and the page still looks finished with all of it switched off.
 */
export function MediaLayer({
  poster,
  posterAlt = '',
  backdrop = 'depth',
  video,
  scene = false,
  className,
  priority = false,
}: MediaLayerProps) {
  const tier = useDeviceTier();
  const videoRef = useRef<HTMLVideoElement>(null);

  const showScene = scene && tier === 'high';
  const showVideo = !showScene && Boolean(video) && tier !== 'low';

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !showVideo) return;
    // Autoplay can be refused (low-power mode, policy); the still stays visible.
    element.play().catch(() => {});
  }, [showVideo]);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {poster ? (
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority={priority}
          sizes="100vw"
          className={cn(
            'object-cover transition-opacity duration-(--duration-slow)',
            showVideo ? 'opacity-0' : 'opacity-100',
          )}
        />
      ) : (
        <WaterBackdrop variant={backdrop} animated={tier !== 'low'} />
      )}

      {showVideo && video ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={video.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        >
          {video.sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      ) : null}

      {showScene ? <BottleScene className="absolute inset-0" /> : null}
    </div>
  );
}
