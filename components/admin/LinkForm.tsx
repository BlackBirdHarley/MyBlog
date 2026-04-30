"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  displayLabel: z.string().optional(),
  targetUrl: z.string().url("Must be a valid URL"),
  program: z.string().optional(),
  category: z.string().optional(),
  commission: z.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const PROGRAMS = [
  "Amazon Associates",
  "ShareASale",
  "CJ Affiliate",
  "Impact",
  "Rakuten",
  "ClickBank",
  "Other",
];

interface LinkFormProps {
  linkId?: string;
  initialData?: Partial<FormValues>;
}

export function LinkForm({ linkId, initialData }: LinkFormProps) {
  const router = useRouter();
  const isNew = !linkId;
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isActive: true,
      ...initialData,
    },
  });

  async function onSubmit(data: FormValues) {
    const url = isNew ? "/api/admin/links" : `/api/admin/links/${linkId}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        commission: data.commission || null,
        displayLabel: data.displayLabel || null,
        program: data.program || null,
        category: data.category || null,
        notes: data.notes || null,
      }),
    });

    if (res.ok) {
      router.push("/admin/links");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this affiliate link? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/admin/links/${linkId}`, { method: "DELETE" });
    router.push("/admin/links");
    router.refresh();
  }

  const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white";
  const label = "block text-sm font-medium text-gray-700 mb-1";
  const err = "mt-1 text-xs text-red-600";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      {/* Name */}
      <div>
        <label className={label}>Internal name <span className="text-red-500">*</span></label>
        <input {...register("name")} className={field} placeholder="Amazon — Pantry Storage Bins" />
        {errors.name && <p className={err}>{errors.name.message}</p>}
        <p className="mt-1 text-xs text-gray-400">Only visible to you in the admin.</p>
      </div>

      {/* Target URL */}
      <div>
        <label className={label}>Destination URL <span className="text-red-500">*</span></label>
        <input {...register("targetUrl")} className={field} placeholder="https://amazon.com/dp/...?tag=..." />
        {errors.targetUrl && <p className={err}>{errors.targetUrl.message}</p>}
      </div>

      {/* Display label */}
      <div>
        <label className={label}>Default anchor text</label>
        <input {...register("displayLabel")} className={field} placeholder="Check Price on Amazon" />
        <p className="mt-1 text-xs text-gray-400">Suggested text when inserting this link in the editor.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Program */}
        <div>
          <label className={label}>Affiliate program</label>
          <input
            {...register("program")}
            list="programs"
            className={field}
            placeholder="Amazon Associates"
          />
          <datalist id="programs">
            {PROGRAMS.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>

        {/* Category */}
        <div>
          <label className={label}>Category</label>
          <input {...register("category")} className={field} placeholder="Kitchen, Home, etc." />
        </div>
      </div>

      {/* Commission */}
      <div>
        <label className={label}>Commission rate (%)</label>
        <input
          {...register("commission", { valueAsNumber: true })}
          type="number"
          step="0.01"
          min="0"
          max="100"
          className={field}
          placeholder="3.5"
        />
        <p className="mt-1 text-xs text-gray-400">Optional, for your own ROI tracking.</p>
      </div>

      {/* Notes */}
      <div>
        <label className={label}>Notes</label>
        <textarea
          {...register("notes")}
          rows={3}
          className={`${field} resize-none`}
          placeholder="Internal notes about this link…"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 py-3 border-t border-gray-100">
        <input
          {...register("isActive")}
          type="checkbox"
          id="isActive"
          className="w-4 h-4 rounded border-gray-300 accent-gray-900"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
          <span className="ml-1.5 text-xs text-gray-400 font-normal">
            (inactive links render as plain text in articles)
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isNew ? "Create link" : "Save changes"}
        </button>
        <Link
          href="/admin/links"
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
