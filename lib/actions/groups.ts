"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createGroup(name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[createGroup] User not authenticated");
    return { error: "Not authenticated" };
  }

  console.log("[createGroup] Creating group for user:", user.id);

  // Generate unique invite code
  const { data: inviteCode, error: codeError } = await supabase.rpc(
    "generate_invite_code"
  );

  if (codeError) {
    console.error("[createGroup] Error generating invite code:", codeError);
    return { error: `Failed to generate invite code: ${codeError.message}` };
  }

  if (!inviteCode) {
    console.error("[createGroup] No invite code returned");
    return { error: "Failed to generate invite code: No code returned" };
  }

  console.log("[createGroup] Generated invite code:", inviteCode);

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error("[createGroup] Error creating group:", groupError);
    return { error: `Failed to create group: ${groupError.message}` };
  }

  console.log("[createGroup] Group created:", group.id);

  // Add creator as first member
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    balance: 0, // Start at $0, bets create debt
  });

  if (memberError) {
    console.error("[createGroup] Error adding member:", memberError);
    // Rollback: delete the group
    await supabase.from("groups").delete().eq("id", group.id);
    return { error: `Failed to add you to the group: ${memberError.message}` };
  }

  console.log("[createGroup] Member added successfully");

  revalidatePath("/home");
  return { data: group };
}

export async function joinGroup(inviteCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (groupError || !group) {
    return { error: "Invalid invite code" };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    return { error: "You are already a member of this group" };
  }

  // Add user to group
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    balance: 0, // Start at $0, bets create debt
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/home");
  return { data: group };
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Remove user from group
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/home");
  return { success: true };
}

