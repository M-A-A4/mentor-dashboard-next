
"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function UserStorage() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    localStorage.setItem("mentor-user-id", session.user.id);
  }, [session]);

  return null;
}
