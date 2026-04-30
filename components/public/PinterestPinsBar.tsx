import Image from "next/image";
import { PinterestButton } from "./PinterestButton";

interface Pin {
  imageUrl: string;
  description: string | null;
}

interface PinterestPinsBarProps {
  pins: Pin[];
  pageUrl: string;
  pinterestUserId: string | null;
}

export function PinterestPinsBar({ pins, pageUrl, pinterestUserId }: PinterestPinsBarProps) {
  if (pins.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-2xl p-5 my-8">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Save to Pinterest</p>
      <div className="flex flex-wrap gap-4">
        {pins.map((pin, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-24">
            <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden border border-gray-100">
              <Image src={pin.imageUrl} alt={pin.description ?? "Pin image"} fill className="object-cover" sizes="96px" />
            </div>
            <PinterestButton
              pageUrl={pageUrl}
              imageUrl={pin.imageUrl}
              description={pin.description ?? ""}
              pinterestUserId={pinterestUserId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
