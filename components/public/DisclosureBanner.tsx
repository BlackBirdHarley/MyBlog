export function DisclosureBanner({ text }: { text: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-6">
      {text}
    </div>
  );
}
