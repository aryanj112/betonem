"use server";

import { createClient } from "@/lib/supabase/server";

export async function createUserProfile(data: {
  username: string;
  displayName: string;
  venmoUsername?: string;
  avatarUrl?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check username availability
  const { data: existingUser } = await supabase
    .from("users")
    .select("username")
    .eq("username", data.username.toLowerCase())
    .single();

  if (existingUser) {
    return { error: "Username already taken" };
  }

  // Get user email from auth
  const email = user.email || "";

  // Create user profile with service role
  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    phone_number: email, // Using email for now
    username: data.username.toLowerCase(),
    display_name: data.displayName,
    venmo_username: data.venmoUsername || null,
    avatar_url: data.avatarUrl || null,
  });

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: insertError.message };
  }

  return { success: true };
}

