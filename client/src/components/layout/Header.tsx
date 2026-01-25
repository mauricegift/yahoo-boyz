import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Wallet,
  PiggyBank,
  Banknote,
  Info,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const authenticatedLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/contributions", label: "Contributions", icon: "Wallet" },
  { href: "/savings", label: "Savings", icon: "PiggyBank" },
  { href: "/loans", label: "Loans", icon: "Banknote" },
  { href: "/about", label: "About Us", icon: "Info" },
  { href: "/contact", label: "Contact", icon: "MessageCircle" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, themePreference, setThemePreference } = useTheme();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Disable scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-b-3xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.jpg" alt="YAHOO-BOYZ" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-bold text-lg">
              YAHOO-BOYZ
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {authenticatedLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={location === link.href ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-1.5"
                      data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.icon === "LayoutDashboard" && <LayoutDashboard className="h-4 w-4" />}
                      {link.icon === "Wallet" && <Wallet className="h-4 w-4" />}
                      {link.icon === "PiggyBank" && <PiggyBank className="h-4 w-4" />}
                      {link.icon === "Banknote" && <Banknote className="h-4 w-4" />}
                      {link.icon === "Info" && <Info className="h-4 w-4" />}
                      {link.icon === "MessageCircle" && <MessageCircle className="h-4 w-4" />}
                      {link.label}
                    </Button>
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant={location === "/admin" ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-1.5"
                      data-testid="nav-link-admin"
                    >
                      <Settings className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                {publicLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={location === link.href ? "secondary" : "ghost"}
                      size="sm"
                      data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-theme-toggle"
                >
                  {theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setThemePreference("light")}
                  className={themePreference === "light" ? "bg-accent" : ""}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemePreference("dark")}
                  className={themePreference === "dark" ? "bg-accent" : ""}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemePreference("system")}
                  className={themePreference === "system" ? "bg-accent" : ""}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.profilePicture || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.profilePicture || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      data-testid="menu-profile"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" data-testid="button-signup">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div 
          className={`md:hidden border-t overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-[600px] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
          }`}
        >
          <div className="space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/contributions" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/contributions" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Wallet className="h-4 w-4" />
                    My Contributions
                  </Button>
                </Link>
                <Link href="/savings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/savings" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <PiggyBank className="h-4 w-4" />
                    My Savings
                  </Button>
                </Link>
                <Link href="/loans" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/loans" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Banknote className="h-4 w-4" />
                    My Loans
                  </Button>
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/about" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <Info className="h-4 w-4" />
                    About Us
                  </Button>
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={location === "/contact" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contact
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={location === "/admin" ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={location === link.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-2 border-t space-y-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="mobile-login"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" data-testid="mobile-signup">
                      Join Now
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
