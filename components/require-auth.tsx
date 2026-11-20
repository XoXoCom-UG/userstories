"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * The real check behind proxy.ts's cookie test: draws its children only for a
 * session Supabase accepted, and sends everyone else to /login. While the
 * session is still being read it draws nothing, so the page never flashes for
 * someone who is not signed in.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !token) router.replace("/login"); }, [loading, token, router]);
  if (loading || !token) return <div className="boot" role="status" aria-label="Loading" />;
  return <>{children}</>;
}
