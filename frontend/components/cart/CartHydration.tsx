"use client";

import { useEffect } from "react";
import { ensureCartHydrated } from "@/lib/cart-store";

export default function CartHydration() {
  useEffect(() => {
    void ensureCartHydrated();
  }, []);

  return null;
}
