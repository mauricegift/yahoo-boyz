import { useEffect, useRef, useState, ReactNode } from "react";

type AnimationType = 
  | "fade-up" 
  | "fade-down" 
  | "fade-left" 
  | "fade-right" 
  | "zoom-in" 
  | "zoom-out" 
  | "shake"
  | "rotate"
  | "bounce";

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

const animationStyles: Record<AnimationType, { initial: string; animate: string }> = {
  "fade-up": {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-down": {
    initial: "opacity-0 -translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-left": {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "fade-right": {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "zoom-in": {
    initial: "opacity-0 scale-75",
    animate: "opacity-100 scale-100",
  },
  "zoom-out": {
    initial: "opacity-0 scale-125",
    animate: "opacity-100 scale-100",
  },
  "shake": {
    initial: "opacity-0",
    animate: "opacity-100 animate-shake",
  },
  "rotate": {
    initial: "opacity-0 rotate-12",
    animate: "opacity-100 rotate-0",
  },
  "bounce": {
    initial: "opacity-0 translate-y-4",
    animate: "opacity-100 translate-y-0 animate-bounce-once",
  },
};

export function ScrollAnimation({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 500,
  className = "",
  threshold = 0.1,
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  const styles = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={`transition-all ${className} ${isVisible ? styles.animate : styles.initial}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedHeartbeat() {
  return (
    <span className="inline-block animate-heartbeat">
      <span className="animate-color-cycle">❤️</span>
    </span>
  );
}
