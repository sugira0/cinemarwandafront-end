import { useEffect, useRef } from 'react';

export default function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const {
    threshold = 0.12,
    root = null,
    rootMargin = '0px',
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('revealed');
        observer.unobserve(element);
      }
    }, { threshold, root, rootMargin });

    observer.observe(element);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  return ref;
}
