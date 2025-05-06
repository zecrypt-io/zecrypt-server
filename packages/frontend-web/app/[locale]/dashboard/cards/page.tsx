'use client';

import { useTranslator } from "@/hooks/use-translations";

export default function CardsPage() {
  const { translate } = useTranslator();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{translate("cards", "dashboard")}</h1>
      <p className="mt-4 text-muted-foreground">
        {translate("cards_coming_soon", "dashboard", {
          default: "Cards module is under development.",
        })}
      </p>
    </div>
  );
}