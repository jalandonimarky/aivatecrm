import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { UserProfileCard } from "@/components/UserProfileCard";
import type { Profile } from "@/types/crm";
import { Trash2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components directly

// Zod schema for profile updates
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  countryRegion: z.string().optional(), // New field
});

// Zod schema for password updates
const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryRegion: "", // Initialize new field
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const fetchOrCreateUserProfile = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      toast({
        title: "Error",
        description: userError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at, country_region") // Select new column
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        toast({
          title: "Error",
          description: profileError.message,
          variant: "destructive",
        });
      } else if (profileData) {
        setUserProfile(profileData as Profile);
        profileForm.reset({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: profileData.email,
          countryRegion: profileData.country_region || "", // Set new field
        });
      } else {
        const { data: newProfileData, error: createProfileError } = await supabase
          .from("profiles")
          .insert({ 
            id: user.id,
            email: user.email || "",
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            country_region: "", // Default for new profile
          })
          .select("id, first_name, last_name, email, avatar_url, role, created_at, updated_at, country_region") // Select new column
          .single();

        if (createProfileError) {
          toast({
            title: "Error creating profile",
            description: createProfileError.message,
            variant: "destructive",
          });
        } else if (newProfileData) {
          setUserProfile(newProfileData as Profile);
          profileForm.reset({
            firstName: newProfileData.first_name || "",
            lastName: newProfileData.last_name || "",
            email: newProfileData.email,
            countryRegion: newProfileData.country_region || "", // Set new field
          });
          toast({
            title: "Profile Created",
            description: "A new profile has been created for your account.",
          });
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrCreateUserProfile();
  }, [toast]);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      if (values.email !== userProfile?.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: values.email,
        });
        if (emailUpdateError) throw emailUpdateError;
        toast({
          title: "Email Update",
          description: "Your email has been updated. Please check your new email for a confirmation link.",
        });
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ 
          first_name: values.firstName, 
          last_name: values.lastName, 
          email: values.email,
          country_region: values.countryRegion, // Update new field
        })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      await fetchOrCreateUserProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAvatarFile(event.target.files[0]);
    } else {
      setAvatarFile(null);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload.",
        variant: "default",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      const fileExtension = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) throw new Error("Could not get public URL for uploaded avatar.");

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated.",
      });
      setAvatarFile(null);
      await fetchOrCreateUserProfile();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userProfile?.avatar_url) {
      toast({
        title: "No avatar to remove",
        description: "You don't have a profile picture set.",
        variant: "default",
      });
      return;
    }

    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated.");

      const urlParts = userProfile.avatar_url.split('/');
      const filePathInBucket = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([filePathInBucket]);

      if (storageError) throw storageError;

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been successfully removed.",
      });
      await fetchOrCreateUserProfile();
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      toast({
        title: "Error removing avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-accent dark:text-primary mb-6">
          Settings
        </h1>
        <Skeleton className="h-24 w-full mb-6" />
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Theme Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${userProfile?.first_name?.charAt(0) || ''}${userProfile?.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-accent dark:text-primary mb-6">
        Settings
      </h1>

      {/* Combined Profile Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-2"> {/* Added flex-col and items-center */}
              <Avatar className="w-24 h-24 border border-border"> {/* Increased size */}
                {userProfile?.avatar_url ? (
                  <AvatarImage src={userProfile.avatar_url} alt={`${userProfile.first_name} ${userProfile.last_name}'s avatar`} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-4xl font-semibold"> {/* Adjusted text size */}
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <Label className="text-base">Profile Picture</Label> {/* Moved label here */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full justify-center"> {/* Centered buttons */}
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={uploadingAvatar}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex-1 bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> {avatarFile ? "Change Image" : "Choose Image"}
                </Button>
                {avatarFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                    {avatarFile.name}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar || !userProfile?.avatar_url}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </Button>
                <Button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={uploadingAvatar || !avatarFile}
                  className="bg-gradient-primary"
                >
                  {uploadingAvatar ? "Uploading..." : <><UploadCloud className="w-4 h-4 mr-2" /> Upload</>}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Profile Information Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...profileForm.register("firstName")} />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-destructive text-sm">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...profileForm.register("lastName")} />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-destructive text-sm">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email && (
                  <p className="text-destructive text-sm">{profileForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryRegion">Country/Region</Label>
                <Input id="countryRegion" {...profileForm.register("countryRegion")} placeholder="e.g., United States" />
                {/* Note: For a full dropdown with country data, additional implementation would be needed. */}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-gradient-primary" disabled={loading}>
                {loading ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Change Password Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-destructive text-sm">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" {...passwordForm.register("confirmNewPassword")} />
              {passwordForm.formState.errors.confirmNewPassword && (
                <p className="text-destructive text-sm">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-gradient-primary" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Theme Settings Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="text-base">Dark Mode</Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}