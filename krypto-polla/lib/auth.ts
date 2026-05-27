import "server-only";
import { cookies } from "next/headers";
import { db } from "./supabase";
import type { Participant } from "./types";

const COOKIE = "kp_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 días

export async function loginByCode(code: string): Promise<Participant | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await db()
    .from("participants")
    .select("*")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (error || !data) return null;

  const jar = await cookies();
  jar.set(COOKIE, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return data as Participant;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<Participant | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const { data, error } = await db()
    .from("participants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Participant;
}

export async function requireUser(): Promise<Participant> {
  const u = await currentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function requireAdmin(): Promise<Participant> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}
