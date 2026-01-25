import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth, getAuthHeader } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { contactFormSchema, type ContactMessage } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Contact() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<
    ContactMessage[]
  >({
    queryKey: ["/api/contact/messages"],
    enabled: isAuthenticated,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactFormSchema>) => {
      return apiRequest("POST", "/api/contact/messages", data);
    },
    onSuccess: () => {
      toast.success("Message sent successfully! We'll respond soon.", {
        closeButton: true,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/contact/messages"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message", {
        closeButton: true,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof contactFormSchema>) => {
    sendMessageMutation.mutate(data);
  };

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
                  Contact <span className="text-primary">Us</span>
                </h1>
                <p className="text-lg text-white/90">
                  Have questions? We're here to help. Send us a message and our
                  team will respond as soon as possible.
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Grid Item 1: Get in Touch */}
              <ScrollAnimation animation="fade-right">
                <div className="col-span-1">
                  <Card className="h-full">
                    <CardContent className="pt-6 h-full">
                      <h3 className="font-semibold text-lg mb-4">Get in Touch</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Phone</p>
                          <a 
                            href="tel:+254748721079" 
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            +254 748 721 079
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Email</p>
                          <a 
                            href="mailto:nightcoller33@gmail.com" 
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            nightcoller33@gmail.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground">
                            Gboko, Nigeria
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Response Time</p>
                          <p className="text-muted-foreground">
                            As soon as we receive your message, usually within
                            24 hours
                          </p>
                        </div>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollAnimation>

              {/* Grid Item 2: Send a Message */}
              <ScrollAnimation animation="fade-left" delay={100}>
                <div className="col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Send a Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAuthenticated ? (
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="What's this about?"
                                    {...field}
                                    data-testid="input-subject"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Tell us how we can help..."
                                    rows={5}
                                    {...field}
                                    data-testid="input-message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full gap-2"
                            disabled={sendMessageMutation.isPending}
                            data-testid="button-send-message"
                          >
                            {sendMessageMutation.isPending ? (
                              "Sending..."
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                          Please log in to send a message and view your message
                          history.
                        </p>
                        <Link href="/login">
                          <Button data-testid="button-login-to-contact">
                            Login to Contact Us
                          </Button>
                        </Link>
                      </div>
                    )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollAnimation>

              {/* Grid Item 3: FAQ */}
              <ScrollAnimation animation="fade-right" delay={200}>
                <div className="col-span-1">
                <Card className="h-full">
                  <CardContent className="pt-6 h-full">
                    <h3 className="font-semibold text-lg mb-4">
                      Frequently Asked
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-sm">How do I join?</p>
                        <p className="text-sm text-muted-foreground">
                          Simply create an account and start contributing Ksh 20
                          daily.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Can someone save?</p>
                        <p className="text-sm text-muted-foreground">
                          Yes you can save amount of your choice at any time of
                          the day(unlimited).
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          How do I get a loan?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Apply through your dashboard. Our admin team reviews
                          applications promptly.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          What's the interest rate?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          All loans have a fixed 15% interest rate.
                        </p>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollAnimation>

              {/* Grid Item 4: Message History */}
              <ScrollAnimation animation="fade-left" delay={300}>
                <div className="col-span-1">
                {isAuthenticated && (
                  <Card className="h-full">
                    <CardContent className="pt-6 h-full">
                      <h2 className="text-xl font-bold mb-6">Your Messages</h2>
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Card key={i}>
                              <CardContent className="pt-6">
                                <Skeleton className="h-6 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-full mb-4" />
                                <Skeleton className="h-4 w-2/3" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {messages.map((msg) => (
                            <Card
                              key={msg.id}
                              data-testid={`message-card-${msg.id}`}
                            >
                              <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                                  <h4 className="font-semibold">
                                    {msg.subject}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {msg.adminReply ? (
                                      <Badge
                                        variant="default"
                                        className="gap-1"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                        Replied
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="gap-1"
                                      >
                                        <Clock className="h-3 w-3" />
                                        Pending
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(msg.createdAt),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {msg.message}
                                  </p>
                                </div>
                                {msg.adminReply && (
                                  <div className="bg-primary/5 border-l-2 border-primary rounded-r-lg p-3">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Reply from {(msg as any).repliedByName || 'Admin'} -{" "}
                                      {msg.repliedAt &&
                                        format(
                                          new Date(msg.repliedAt),
                                          "MMM d, yyyy",
                                        )}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {msg.adminReply}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            You haven't sent any messages yet.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  )}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
