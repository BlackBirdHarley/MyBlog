"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check } from "lucide-react";

const schema = z.object({
  siteName: z.string().min(1, "Required"),
  siteTagline: z.string().optional(),
  siteDescription: z.string().optional(),
  siteUrl: z.string().url("Must be a valid URL (include https://)").or(z.literal("")).optional(),
  twitterHandle: z.string().optional(),
  defaultDisclosure: z.string().min(1, "Required"),
  footerText: z.string().optional(),
  pinterestUserId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SettingsFormProps {
  initialData: Partial<FormValues>;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      siteName: "",
      defaultDisclosure: "This post contains affiliate links. If you purchase through these links, I may earn a commission at no additional cost to you.",
      ...initialData,
    },
  });

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        siteUrl: data.siteUrl || null,
        siteTagline: data.siteTagline || null,
        siteDescription: data.siteDescription || null,
        twitterHandle: data.twitterHandle || null,
        footerText: data.footerText || null,
        pinterestUserId: data.pinterestUserId || null,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  }

  const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";
  const label = "block text-sm font-medium text-gray-700 mb-1";
  const err = "mt-1 text-xs text-red-600";
  const hint = "mt-1 text-xs text-gray-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">

      {/* Site identity */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Site identity</h2>

        <div>
          <label className={label}>Site name <span className="text-red-500">*</span></label>
          <input {...register("siteName")} className={field} placeholder="My Awesome Blog" />
          {errors.siteName && <p className={err}>{errors.siteName.message}</p>}
        </div>

        <div>
          <label className={label}>Tagline</label>
          <input {...register("siteTagline")} className={field} placeholder="Helping you find the best home products" />
          <p className={hint}>Shown in the site header / homepage.</p>
        </div>

        <div>
          <label className={label}>Site description</label>
          <textarea {...register("siteDescription")} rows={2} className={`${field} resize-none`} placeholder="Meta description for the homepage" />
        </div>

        <div>
          <label className={label}>Site URL</label>
          <input {...register("siteUrl")} className={field} placeholder="https://yourblog.com" />
          {errors.siteUrl && <p className={err}>{errors.siteUrl.message}</p>}
          <p className={hint}>Used in JSON-LD structured data and canonical URLs.</p>
        </div>
      </section>

      {/* Social */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Social</h2>

        <div>
          <label className={label}>Twitter / X handle</label>
          <input {...register("twitterHandle")} className={field} placeholder="@yourblog" />
          <p className={hint}>Used in Twitter card metadata.</p>
        </div>

        <div>
          <label className={label}>Pinterest user ID</label>
          <input {...register("pinterestUserId")} className={field} placeholder="yourusername" />
          <p className={hint}>Your Pinterest username — used to attribute saved pins.</p>
        </div>
      </section>

      {/* Content defaults */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Content defaults</h2>

        <div>
          <label className={label}>Default affiliate disclosure <span className="text-red-500">*</span></label>
          <textarea {...register("defaultDisclosure")} rows={3} className={`${field} resize-none`} />
          {errors.defaultDisclosure && <p className={err}>{errors.defaultDisclosure.message}</p>}
          <p className={hint}>Shown on every article. Can be overridden per-article.</p>
        </div>

        <div>
          <label className={label}>Footer text</label>
          <input {...register("footerText")} className={field} placeholder="© 2026 My Blog" />
          <p className={hint}>Leave blank to auto-generate from site name and year.</p>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
          {saved ? "Saved!" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
