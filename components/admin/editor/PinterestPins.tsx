"use client";

import { Plus, Trash2 } from "lucide-react";
import { PinImageUpload } from "./PinImageUpload";

export interface PinItem {
  key: string;
  imageUrl: string | null;
  description: string;
}

interface PinterestPinsProps {
  value: PinItem[];
  onChange: (pins: PinItem[]) => void;
}

export function PinterestPins({ value, onChange }: PinterestPinsProps) {
  function addPin() {
    onChange([...value, { key: crypto.randomUUID(), imageUrl: null, description: "" }]);
  }

  function remove(key: string) {
    onChange(value.filter((p) => p.key !== key));
  }

  function update(key: string, patch: Partial<PinItem>) {
    onChange(value.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-3">
      {value.map((pin, i) => (
        <div key={pin.key} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-200">
          <PinImageUpload
            value={pin.imageUrl}
            onChange={(url) => update(pin.key, { imageUrl: url })}
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Pin {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(pin.key)}
                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              value={pin.description}
              onChange={(e) => update(pin.key, { description: e.target.value })}
              rows={3}
              placeholder="Pin description…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none bg-white"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPin}
        className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 rounded-xl px-3 py-2.5 hover:border-gray-400 transition-colors"
      >
        <Plus size={14} />
        Add pin
      </button>
    </div>
  );
}
