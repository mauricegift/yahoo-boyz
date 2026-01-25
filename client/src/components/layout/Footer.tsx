import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import { ScrollAnimation, AnimatedHeartbeat } from "@/components/ui/scroll-animation";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightYears = currentYear > 2025 ? `2025-${currentYear}` : "2025";

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ScrollAnimation animation="fade-up" delay={0}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  YB
                </div>
                <span className="font-bold text-lg">YAHOO-BOYZ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Grow together with daily contributions and accessible loans.
                Building financial security for all members.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="fade-up" delay={100}>
            <div className="space-y-4">
              <h3 className="font-semibold">Quick Links</h3>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="fade-up" delay={200}>
            <div className="space-y-4">
              <h3 className="font-semibold">Services</h3>
              <nav className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Daily Contributions
                </span>
                <span className="text-sm text-muted-foreground">
                  Flexible Savings
                </span>
                <span className="text-sm text-muted-foreground">
                  Loan Applications
                </span>
                <span className="text-sm text-muted-foreground">
                  M-Pesa Payments
                </span>
                <span className="text-sm text-muted-foreground">
                  Member Support
                </span>
              </nav>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animation="fade-up" delay={300}>
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Info</h3>
              <div className="flex flex-col gap-3">
                <a 
                  href="tel:+254748721079" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>+254 748 721 079</span>
                </a>
                <a 
                  href="mailto:nightcoller33@gmail.com" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>nightcoller33@gmail.com</span>
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Gboko, Nigeria</span>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>

        <ScrollAnimation animation="fade-up" delay={400}>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {copyrightYears} YAHOO-BOYZ. All rights reserved.
            </p>
            <p className="font-bold mt-1">
              Designed with <AnimatedHeartbeat /> by{" "}
              <a
                href="https://me.giftedtech.co.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Gifted Tech
              </a>
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </footer>
  );
}
