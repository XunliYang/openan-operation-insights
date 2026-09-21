import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** 数字滚动动画：缓出曲线，尊重"减少动态效果"偏好 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(0);
      return;
    }

    if (prefersReducedMotion() || duration <= 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}
