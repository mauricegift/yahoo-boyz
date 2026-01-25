import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale" | "none";
  hoverEffect?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, delay = 0, animation = "fade-up", hoverEffect = false, style, ...props }, ref) => {
    const animationClasses = {
      "fade-up": "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
      "fade-left": "animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both",
      "fade-right": "animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both",
      "scale": "animate-in fade-in zoom-in-95 duration-300 fill-mode-both",
      "none": "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm",
          animationClasses[animation],
          hoverEffect && "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
          className
        )}
        style={{ ...style, animationDelay: `${delay}ms` }}
        {...props}
      />
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  AnimatedCard,
}
