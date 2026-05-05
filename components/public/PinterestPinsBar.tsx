import Image from "next/image";
import { PinterestButton } from "./PinterestButton";

interface Pin {
  imageUrl: string;
  title?: string | null;
  altText?: string | null;
  description: string | null;
  linkUrl?: string | null;
  taggedTopics?: string[];
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
              <Image src={pin.imageUrl} alt={pin.altText ?? pin.description ?? "Pin image"} fill className="object-cover" sizes="96px" />
            </div>
            <PinterestButton
              pageUrl={resolvePinUrl(pin.linkUrl, pageUrl)}
              imageUrl={pin.imageUrl}
              title={pin.title}
              description={pin.description ?? ""}
              pinterestUserId={pinterestUserId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function resolvePinUrl(pinUrl: string | null | undefined, pageUrl: string) {
  if (!pinUrl) return pageUrl;
  if (/^https?:\/\//i.test(pinUrl)) return pinUrl;
  try {
    return new URL(pinUrl, pageUrl).toString();
  } catch {
    return pageUrl;
  }
}
