"use server";

import { redirect } from "next/navigation";
import { loginByCode, logout } from "@/lib/auth";

export async function loginAction(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const user = await loginByCode(code);
  if (!user) {
    redirect("/?error=invalid");
  }
  redirect(user.role === "admin" ? "/admin" : "/play");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/");
}
