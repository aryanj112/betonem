"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { createUserProfile } from "@/lib/actions/auth";
import { Camera } from "lucide-react";

interface ProfileSetupFormProps {
  userId: string;
  email?: string;
  phone?: string;
}

export function ProfileSetupForm({ userId, email, phone }: ProfileSetupFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const validateUsername = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setUsernameError("Username must be 3-20 characters");
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameError("Only lowercase letters, numbers, and underscores");
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Validate username
      if (!validateUsername(username)) {
        setIsLoading(false);
        return;
      }

      const finalUsername = username.trim().toLowerCase();

      // Check username availability
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", finalUsername)
        .single();

      if (existingUser) {
        setUsernameError("Username already taken");
        setIsLoading(false);
        return;
      }

      let avatarUrl = null;

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Create user profile using server action
      const result = await createUserProfile({
        username: finalUsername,
        displayName: displayName.trim(),
        venmoUsername: venmoUsername.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      console.log("Profile created successfully, redirecting to home...");
      
      // Success! Force a hard refresh to clear any cached auth state
      window.location.href = "/home";
    } catch (err: any) {
      console.error("Profile setup error:", err);
      setError(err.message || "Failed to create profile");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Set up your account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
              >
                <Camera className="w-4 h-4" />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">Optional</p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-primary">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateUsername(e.target.value);
              }}
              required
              minLength={3}
              maxLength={20}
            />
            {usernameError && (
              <p className="text-sm text-primary">{usernameError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Lowercase, alphanumeric, underscores only
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-primary">*</span>
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={1}
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">
              Your display name
            </p>
          </div>

          {/* Venmo Username */}
          <div className="space-y-2">
            <Label htmlFor="venmoUsername">Venmo Username (Optional)</Label>
            <Input
              id="venmoUsername"
              type="text"
              placeholder="@johndoe"
              value={venmoUsername}
              onChange={(e) => {
                let val = e.target.value;
                if (val && !val.startsWith("@")) {
                  val = "@" + val;
                }
                setVenmoUsername(val);
              }}
            />
            <p className="text-sm text-muted-foreground">
              For settling bets
            </p>
          </div>

          {error && <p className="text-sm text-primary">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

