import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  User,
  Phone,
  Mail,
  Camera,
  Lock,
  Shield,
  CheckCircle,
  Settings,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/ui/page-transition";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
      .refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
      .refine((val) => /\d/.test(val), "Password must contain a number")
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type TabValue = "profile" | "security";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Image cropping state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Fetch fresh user data from server
  const { data: freshUserData } = useQuery({
    queryKey: ["/api/user/me"],
    enabled: !!user,
  });

  // Update local user data when fresh data is fetched
  useEffect(() => {
    if (freshUserData) {
      updateUser(freshUserData as any);
    }
  }, [freshUserData]);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        phone: user.phone,
      });
    }
  }, [user?.name, user?.phone]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: (data: any) => {
      if (data.user) {
        updateUser(data.user);
        toast.success("Profile updated successfully!", { closeButton: true });
      } else {
        toast.error("Invalid response from server", { closeButton: true });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile", {
        closeButton: true,
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      return apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: (data: any) => {
      if (data.message) {
        toast.success(data.message, { closeButton: true });
      } else {
        toast.success("Password updated successfully!", { closeButton: true });
      }
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update password", {
        closeButton: true,
      });
    },
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async (picture: string) => {
      return apiRequest("PATCH", "/api/user/picture", { picture });
    },
    onSuccess: (data: any) => {
      if (data.user) {
        updateUser(data.user);
        toast.success("Profile picture updated!", { closeButton: true });
      } else {
        toast.error("Invalid response from server", { closeButton: true });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload picture", {
        closeButton: true,
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file", { closeButton: true });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB", { closeButton: true });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageSrc(base64);
      setCropDialogOpen(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read image", { closeButton: true });
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = useCallback(async (): Promise<string> => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      return imageSrc;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize,
    );

    return canvas.toDataURL('image/png');
  }, [completedCrop, imageSrc]);

  const handleCropComplete = async () => {
    setIsUploading(true);
    try {
      const croppedImage = await getCroppedImg();
      uploadPictureMutation.mutate(croppedImage);
      setCropDialogOpen(false);
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      toast.error("Failed to crop image", { closeButton: true });
    }
    setIsUploading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar - Profile Summary */}
            <div className="md:w-1/3">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage
                          src={user.profilePicture || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full h-9 w-9"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={
                          isUploading || uploadPictureMutation.isPending
                        }
                        data-testid="button-upload-picture"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-bold">{user.name}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap items-center gap-2 justify-center">
                        {getRoleBadge(user.role)}
                        {user.isVerified && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-primary border-primary"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="w-full space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Member since:
                        </span>
                        <span className="font-medium">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Contributions:
                        </span>
                        <span className="font-medium text-primary">
                          Ksh {parseFloat(user.totalContributions || "0").toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Savings:
                        </span>
                        <span className="font-medium text-primary">
                          Ksh {parseFloat(user.totalSavings || "0").toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Loans:
                        </span>
                        <span className="font-medium text-primary">
                          Ksh {parseFloat(user.totalLoans || "0").toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          OTP Preference:
                        </span>
                        <Badge variant="outline" className="uppercase">
                          {user.otpPreference}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Content - Tabs */}
            <div className="md:w-2/3">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TabValue)}
              >
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details. Email cannot be changed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit((data) =>
                            updateProfileMutation.mutate(data),
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      className="pl-10"
                                      {...field}
                                      data-testid="input-name"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative mt-1.5">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={user.email}
                                disabled
                                className="pl-10 bg-muted"
                                data-testid="input-email-disabled"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Email address cannot be changed
                            </p>
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      className="pl-10"
                                      {...field}
                                      data-testid="input-phone"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                            className="w-full sm:w-auto"
                          >
                            {updateProfileMutation.isPending
                              ? "Saving..."
                              : "Save Changes"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit((data) =>
                            updatePasswordMutation.mutate(data),
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    data-testid="input-current-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    data-testid="input-new-password"
                                  />
                                </FormControl>
                                <PasswordStrength password={field.value} />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    {...field}
                                    data-testid="input-confirm-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={updatePasswordMutation.isPending}
                            data-testid="button-update-password"
                            className="w-full sm:w-auto"
                          >
                            {updatePasswordMutation.isPending
                              ? "Updating..."
                              : "Update Password"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Account Security Status</CardTitle>
                      <CardDescription>
                        Overview of your account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Email Verification</p>
                              <p className="text-sm text-muted-foreground">
                                Your email is verified
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            {user.isVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Account Role</p>
                              <p className="text-sm text-muted-foreground">
                                Your account permissions
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">OTP Delivery Method</p>
                              <p className="text-sm text-muted-foreground">
                                How you receive verification codes
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="uppercase">
                            {user.otpPreference}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Image Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCropDialogOpen(false);
          setImageSrc("");
          setCrop(undefined);
          setCompletedCrop(undefined);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Drag to adjust the circular crop area for your profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="max-h-[400px] w-auto"
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCropDialogOpen(false);
                setImageSrc("");
                setCrop(undefined);
                setCompletedCrop(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={isUploading || !completedCrop}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
