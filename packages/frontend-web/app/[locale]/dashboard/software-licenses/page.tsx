'use client';

import { useTranslator } from "@/hooks/use-translations";

export default function SoftwareLicensesPage() {
  const { translate } = useTranslator();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{translate("software_licenses", "dashboard")}</h1>
      <p className="mt-4 text-muted-foreground">
        {translate("software_licenses_coming_soon", "dashboard", {
          default: "Software Licenses module is under development.",
        })}
      </p>
    </div>
  );
}