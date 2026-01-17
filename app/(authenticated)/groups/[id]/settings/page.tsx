"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import Link from "next/link";

interface GroupSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const unwrappedParams = React.use(params);
  const groupId = unwrappedParams.id;
  const router = useRouter();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  useEffect(() => {
    loadData();
  }, [groupId]);

  async function loadData() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Get profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(userProfile);

    // Get group details
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError || !groupData) {
      toast({
        title: "Error",
        description: "Group not found",
        variant: "destructive",
      });
      router.push("/home");
      return;
    }

    // Verify user is the creator
    if (groupData.created_by !== user.id) {
      toast({
        title: "Access Denied",
        description: "Only the group creator can access settings",
        variant: "destructive",
      });
      router.push(`/groups/${groupId}`);
      return;
    }

    setGroup(groupData);
    setGroupName(groupData.name);
    setGroupImage(groupData.image_url);
    setIsLoading(false);
  }

  async function handleSave() {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("groups")
      .update({
        name: groupName,
        image_url: groupImage,
      })
      .eq("id", groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group settings updated",
      });
      router.push(`/groups/${groupId}`);
    }

    setIsSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `group-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setGroupImage(publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveImage() {
    setGroupImage(null);
    toast({
      title: "Image removed",
      description: "Click save to confirm changes",
    });
  }

  async function handleDeleteGroup() {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    setIsDeletingGroup(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
      setIsDeletingGroup(false);
    } else {
      toast({
        title: "Group deleted",
        description: "Redirecting to home...",
      });
      router.push("/home");
    }
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Group
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground">Group Settings</h1>

        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your group's name and image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {groupName.length}/50 characters
              </p>
            </div>

            {/* Group Image */}
            <div className="space-y-2">
              <Label>Group Image</Label>
              
              {groupImage ? (
                <div className="flex items-center gap-4">
                  <img
                    src={groupImage}
                    alt="Group"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 5MB. JPG, PNG, or GIF.
                    </p>
                  </div>
                </div>
              )}
              
              {isUploading && (
                <p className="text-sm text-primary">Uploading...</p>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving || !groupName.trim()}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Invite Code */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Code</CardTitle>
            <CardDescription>
              Share this code with others to invite them to the group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={group?.invite_code || ""}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(group?.invite_code || "");
                  toast({
                    title: "Copied!",
                    description: "Invite code copied to clipboard",
                  });
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
              className="w-full"
            >
              {isDeletingGroup ? "Deleting..." : "Delete Group"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete the group, all bets, and member data. This action cannot be undone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

