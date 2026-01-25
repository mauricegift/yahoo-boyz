import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p) => /\d/.test(p) },
  { label: "Contains special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    
    const passedRequirements = requirements.filter((req) => req.test(password)).length;
    const score = (passedRequirements / requirements.length) * 100;
    
    if (score <= 20) return { score, label: "Very Weak", color: "bg-red-500" };
    if (score <= 40) return { score, label: "Weak", color: "bg-orange-500" };
    if (score <= 60) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 80) return { score, label: "Good", color: "bg-lime-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  }, [password]);

  const checkedRequirements = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3 animate-in fade-in slide-in-from-top-2 duration-300", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            "font-medium transition-colors",
            strength.score <= 40 ? "text-red-500" : 
            strength.score <= 60 ? "text-yellow-500" : 
            strength.score <= 80 ? "text-lime-500" : "text-green-500"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500 ease-out rounded-full", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-1.5">
        {checkedRequirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-all duration-200",
              req.passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {req.passed ? (
              <Check className="h-3.5 w-3.5 animate-in zoom-in duration-200" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain a number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain a special character");
  }
  
  return { isValid: errors.length === 0, errors };
}
