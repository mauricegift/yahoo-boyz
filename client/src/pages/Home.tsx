import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Users,
  Wallet,
  Banknote,
  Shield,
  TrendingUp,
  CheckCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Volume,
  Music,
  Speaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth";
import { ScrollAnimation } from "@/components/ui/scroll-animation";

// Media items for the carousel
const mediaItems = [
  {
    type: "video" as const,
    url: "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/video/KbXPb_video.mp4",
    thumbnail:
      "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/image/3fc_image.jpg",
    alt: "Community gathering video",
  },
  {
    type: "video" as const,
    url: "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/video/xcaf_video.mp4",
    thumbnail:
      "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/image/3fc_image.jpg",
    alt: "Financial growth video",
  },
  {
    type: "image" as const,
    url: "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/image/3fc_image.jpg",
    alt: "YAHOO-BOYZ community image",
  },
];

const features = [
  {
    icon: Wallet,
    title: "Daily Contributions",
    description:
      "Build your savings with just Ksh 20 daily. Small steps lead to big achievements.",
  },
  {
    icon: Banknote,
    title: "Accessible Loans",
    description:
      "Apply for loans at 15% interest rate. Quick approval process for eligible members.",
  },
  {
    icon: Shield,
    title: "M-Pesa Integration",
    description:
      "Seamless payments via M-Pesa STK Push. Contribute and repay loans with ease.",
  },
];

const steps = [
  {
    step: 1,
    title: "Create Account",
    description: "Sign up with your email and phone number",
  },
  {
    step: 2,
    title: "Make Daily Contributions",
    description: "Contribute Ksh 20 daily via M-Pesa",
  },
  {
    step: 3,
    title: "Apply for Loans",
    description: "Access loans at 15% interest when eligible",
  },
  {
    step: 4,
    title: "Grow Together",
    description: "Watch your savings grow with the community",
  },
];

const stats = [
  { value: "35+", label: "Active Members" },
  { value: "Ksh 15K+", label: "Total Contributions" },
  { value: "Ksh 12K+", label: "Loans Disbursed" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // For video mute
  const [isAudioMuted, setIsAudioMuted] = useState(false); // For background audio mute
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const carouselInterval = useRef<NodeJS.Timeout | null>(null);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  // Initialize audio
  useEffect(() => {
    // Create audio element
    const audio = new Audio(
      "https://cdn.jsdelivr.net/gh/mauricegift/ghbcdn@main/audio/hTM_audio.mp3",
    );
    audio.loop = true;
    audio.volume = 0.3; // Lower volume to 30%
    audioRef.current = audio;

    // Try to play audio with user interaction requirement
    const playAudio = () => {
      if (audioRef.current && !isAudioMuted) {
        audioRef.current.play().catch((e) => {
          console.log("Audio autoplay prevented:", e);
          // Try again with user interaction
          document.addEventListener(
            "click",
            () => {
              if (audioRef.current && !isAudioMuted) {
                audioRef
                  .current!.play()
                  .catch((e) =>
                    console.log("Audio play after click prevented:", e),
                  );
              }
            },
            { once: true },
          );
        });
      }
    };

    // Try to play after a short delay
    const timer = setTimeout(playAudio, 1000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isAudioMuted]);

  // Auto-rotate carousel
  useEffect(() => {
    if (autoPlayEnabled) {
      carouselInterval.current = setInterval(() => {
        setCurrentMediaIndex(
          (prevIndex) => (prevIndex + 1) % mediaItems.length,
        );
      }, 5000); // Change every 5 seconds
    }

    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current);
      }
    };
  }, [autoPlayEnabled]);

  // Handle video play state
  useEffect(() => {
    if (videoRefs.current[currentMediaIndex]) {
      const currentVideo = videoRefs.current[currentMediaIndex];
      if (currentVideo) {
        if (isPlaying) {
          currentVideo
            .play()
            .catch((e) => console.log("Auto-play prevented:", e));
        } else {
          currentVideo.pause();
        }
        currentVideo.muted = isMuted;
      }
    }
  }, [currentMediaIndex, isPlaying, isMuted]);

  // Handle audio mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isAudioMuted;
      if (!isAudioMuted) {
        audioRef.current
          .play()
          .catch((e) => console.log("Audio play prevented:", e));
      }
    }
  }, [isAudioMuted]);

  const nextMedia = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
    if (carouselInterval.current) {
      clearInterval(carouselInterval.current);
      carouselInterval.current = null;
    }
    setTimeout(() => {
      setAutoPlayEnabled(true);
    }, 10000);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex === 0 ? mediaItems.length - 1 : prevIndex - 1,
    );
    if (carouselInterval.current) {
      clearInterval(carouselInterval.current);
      carouselInterval.current = null;
    }
    setTimeout(() => {
      setAutoPlayEnabled(true);
    }, 10000);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleVideoMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleAudioMute = () => {
    setIsAudioMuted(!isAudioMuted);
    if (!isAudioMuted && audioRef.current) {
      // If unmuting, try to play
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play prevented:", e));
    }
  };

  const handleVideoEnded = () => {
    nextMedia();
  };

  // Don't render homepage if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Media Carousel */}
        <section className="relative h-[70vh] md:h-[80vh] min-h-[500px] md:min-h-[600px] overflow-hidden">
          {/* Media Carousel */}
          <div className="absolute inset-0">
            {mediaItems.map((media, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentMediaIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                {media.type === "video" ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                      if (el && index === currentMediaIndex) {
                        el.play().catch((e) =>
                          console.log("Auto-play prevented:", e),
                        );
                        el.muted = isMuted;
                      }
                    }}
                    src={media.url}
                    poster={media.thumbnail}
                    className="w-full h-full object-cover"
                    loop={index === currentMediaIndex}
                    muted={isMuted}
                    playsInline
                    onEnded={handleVideoEnded}
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={media.alt}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay gradient for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            ))}
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 h-full relative z-10 flex items-center pt-16 md:pt-0">
            <div className="max-w-2xl text-white space-y-4 md:space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/90 text-white px-4 py-1.5 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium backdrop-blur-sm mb-4">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span>Join Kenya's Fastest Growing Chama</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight md:leading-[1.1]">
                <span className="bg-gradient-to-r from-white via-primary-foreground to-primary bg-clip-text text-transparent">
                  YAHOO-BOYZ
                </span>
                <br />
                <span className="text-white text-2xl md:text-3xl lg:text-4xl">
                  Financial Freedom Starts Here
                </span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-xl leading-relaxed">
                Transform your financial future with our trusted community.
                Start with just{" "}
                <span className="font-bold text-primary">Ksh 20 daily</span>,
                access affordable loans, and build lasting wealth together.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 pt-2">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white gap-2 px-6 py-4 md:px-8 md:py-6 text-base md:text-lg font-semibold"
                    data-testid="hero-join-button"
                  >
                    Start Your Journey{" "}
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 ml-1" />
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-white/50 bg-transparent hover:bg-white/10 text-white hover:text-white px-6 py-4 md:px-8 md:py-6 text-base md:text-lg font-semibold"
                    data-testid="hero-learn-button"
                  >
                    Discover More
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-6 text-sm">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-white">No hidden fees</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-white">Secure payments</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-white">24/7 support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Control */}
          <div className="absolute top-24 md:top-28 right-4 md:right-6 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full h-10 w-10 md:h-12 md:w-12 relative"
              onClick={toggleAudioMute}
              title={
                isAudioMuted
                  ? "Unmute background music"
                  : "Mute background music"
              }
            >
              {isAudioMuted ? (
                <VolumeX className="h-5 w-5 md:h-6 md:w-6" />
              ) : (
                <Music className="h-5 w-5 md:h-6 md:w-6" />
              )}
              {!isAudioMuted && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </Button>
          </div>

          {/* Media Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 md:gap-4 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 md:px-6 md:py-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
              onClick={prevMedia}
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Play className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
              onClick={toggleVideoMute}
              title={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10"
              onClick={nextMedia}
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-20 md:bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                  index === currentMediaIndex
                    ? "bg-primary w-6 md:w-8"
                    : "bg-white/50 hover:bg-white"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-card/50">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  Why Choose YAHOO-BOYZ?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                  We provide a transparent and secure platform for group savings
                  and loans.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                  <Card className="border-0 shadow-none bg-background h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <feature.icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground text-sm md:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  How It Works
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
                  Getting started is simple. Follow these four easy steps.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {steps.map((item) => (
                <ScrollAnimation key={item.step} animation="fade-up" delay={(item.step - 1) * 100}>
                  <div className="relative">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                      <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground font-bold text-lg md:text-xl">
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-lg md:text-xl">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.step < 4 && (
                      <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
                    )}
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                      {stat.value}
                    </div>
                    <div className="text-primary-foreground/80 text-sm md:text-base">
                      {stat.label}
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="zoom-in">
              <Card className="border-0 bg-gradient-to-r from-primary/10 to-accent/20">
                <CardContent className="py-10 md:py-12 text-center">
                  <div className="flex justify-center mb-6">
                    <Users className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                    Ready to Start Your Journey?
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto mb-6 md:mb-8 text-sm md:text-base">
                    Join thousands of Kenyans who are building their financial
                    future together. Start with just Ksh 20 today.
                  </p>
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="gap-2 px-6 py-4 md:px-8 md:py-6 text-base md:text-lg"
                      data-testid="cta-join-button"
                    >
                      Create Free Account{" "}
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        /* Smooth transitions for carousel */
        .transition-opacity {
          transition-property: opacity;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
