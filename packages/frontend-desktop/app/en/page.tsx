"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EnRootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/en/dashboard");
  }, [router]);
  return null;
}


