import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FadeIn({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
  return (
    <div
      className={cn("animate-in fade-in duration-500 ease-out fill-mode-both", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SlideIn({ 
  children, 
  className, 
  delay = 0,
  direction = "up" 
}: PageTransitionProps & { delay?: number; direction?: "up" | "down" | "left" | "right" }) {
  const directionClasses = {
    up: "slide-in-from-bottom-4",
    down: "slide-in-from-top-4",
    left: "slide-in-from-right-4",
    right: "slide-in-from-left-4",
  };
  
  return (
    <div
      className={cn(
        "animate-in fade-in duration-500 ease-out fill-mode-both",
        directionClasses[direction],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function ScaleIn({ children, className, delay = 0 }: PageTransitionProps & { delay?: number }) {
  return (
    <div
      className={cn("animate-in fade-in zoom-in-95 duration-300 ease-out fill-mode-both", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({ 
  children, 
  className,
  staggerDelay = 50 
}: { 
  children: ReactNode[]; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
