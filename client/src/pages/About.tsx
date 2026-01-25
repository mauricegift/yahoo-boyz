import { Users, Target, Heart, Shield, Award, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollAnimation } from "@/components/ui/scroll-animation";

const values = [
  {
    icon: Heart,
    title: "Community First",
    description:
      "We believe in the power of collective effort. Together, we achieve more.",
  },
  {
    icon: Shield,
    title: "Transparency",
    description:
      "Every transaction is recorded and visible. No hidden fees or surprises.",
  },
  {
    icon: Award,
    title: "Accountability",
    description:
      "Members hold each other accountable, fostering a culture of responsibility.",
  },
  {
    icon: Clock,
    title: "Consistency",
    description:
      "Small daily contributions lead to significant long-term financial growth.",
  },
];

const team = [
  {
    name: "Community Leaders",
    role: "Administration",
    description: "Dedicated members who ensure smooth operations",
  },
  {
    name: "Finance Team",
    role: "Treasury",
    description: "Managing contributions and loan disbursements",
  },
  {
    name: "Support Team",
    role: "Member Services",
    description: "Available to assist with any questions",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url('https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/image/FRyCH_image.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <ScrollAnimation animation="fade-up">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                  About <span className="text-primary">YAHOO-BOYZ</span>
                </h1>
                <p className="text-lg text-white/90">
                  A community-driven savings and loans platform built on trust,
                  transparency, and the collective power of Kenyan unity.
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <ScrollAnimation animation="fade-right">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                    <Target className="h-4 w-4" />
                    <span>Our Mission</span>
                  </div>
                  <h2 className="text-3xl font-bold">
                    Empowering Financial Growth Through Community
                  </h2>
                  <p className="text-muted-foreground">
                    YAHOO-BOYZ was founded with a simple but powerful idea: when
                    people come together to save, everyone wins. Our platform
                    makes it easy for members to contribute daily, access
                    affordable loans, and build lasting financial security.
                  </p>
                  <p className="text-muted-foreground">
                    We understand the unique financial challenges faced by many
                    Kenyans. That's why we've created a system that's accessible,
                    transparent, and designed to help every member succeed.
                  </p>
                </div>
              </ScrollAnimation>
              <ScrollAnimation animation="fade-left" delay={200}>
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 md:p-12">
                  <div className="flex items-center justify-center">
                    <Users className="h-32 w-32 text-primary/60" />
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  These principles guide everything we do at YAHOO-BOYZ.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                  <Card className="border-0 shadow-none bg-background h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <value.icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {value.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* How Chama Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <ScrollAnimation animation="fade-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">How Our Chama Works</h2>
                  <p className="text-muted-foreground">
                    A simple, effective system designed for maximum benefit.
                  </p>
                </div>
              </ScrollAnimation>

              <div className="space-y-8">
                <ScrollAnimation animation="fade-right" delay={0}>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-3 text-primary">
                        Daily Contributions
                      </h3>
                    <p className="text-muted-foreground mb-4">
                      Every member contributes Ksh 20 daily via M-Pesa. This
                      small amount accumulates quickly - in just one month,
                      you'll have saved Ksh 600!
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Automatic M-Pesa STK Push for easy payment</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Track your contribution history anytime</span>
                      </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>See total group contributions in real-time</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </ScrollAnimation>

                <ScrollAnimation animation="fade-left" delay={100}>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-3 text-primary">
                        Loan Access
                      </h3>
                    <p className="text-muted-foreground mb-4">
                      Eligible members can apply for loans at a fair 10%
                      interest rate. Our admin team reviews applications quickly
                      and fairly.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Apply for up to Ksh 100,000</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>15% interest rate - transparent and fair</span>
                      </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>Clear rejection reasons if not approved</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </ScrollAnimation>

                <ScrollAnimation animation="fade-right" delay={200}>
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-3 text-primary">
                        Penalties for Missed Contributions
                      </h3>
                    <p className="text-muted-foreground mb-4">
                      To maintain fairness, members who miss contributions face
                      penalties:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>First missed day: Ksh 50 penalty</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Second consecutive miss: Ksh 100 penalty</span>
                      </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>Third and beyond: Ksh 150 penalty per day</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Team</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Dedicated members working to ensure the success of every
                  YAHOO-BOYZ member.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {team.map((member, index) => (
                <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                  <Card className="h-full">
                    <CardContent className="pt-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-sm text-primary mb-2">{member.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
