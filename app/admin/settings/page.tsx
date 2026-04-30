import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Site-wide configuration and defaults.</p>
      </div>
      <SettingsForm
        initialData={{
          siteName: settings?.siteName ?? "",
          siteTagline: settings?.siteTagline ?? "",
          siteDescription: settings?.siteDescription ?? "",
          siteUrl: settings?.siteUrl ?? "",
          twitterHandle: settings?.twitterHandle ?? "",
          defaultDisclosure: settings?.defaultDisclosure ?? "This post contains affiliate links. If you purchase through these links, I may earn a commission at no additional cost to you.",
          footerText: settings?.footerText ?? "",
          pinterestUserId: settings?.pinterestUserId ?? "",
        }}
      />
    </div>
  );
}
