import { useTranslator } from "@/hooks/use-translations";

export default function IdentityPage() {
  const { translate } = useTranslator();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{translate("identity", "dashboard")}</h1>
      <p className="mt-4 text-muted-foreground">
        {translate("identity_coming_soon", "dashboard", {
          default: "Identity module is under development.",
        })}
      </p>
    </div>
  );
}