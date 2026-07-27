"use client";

export function ImageNameModal({
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 border border-rule dark:border-gray-700 p-8 max-w-md mx-4 w-full">
        <h2 className="text-lg font-light mb-4 text-ink dark:text-chalk tracking-wide">
          Name your image
        </h2>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="image-name"
          autoFocus
          className="w-full px-3 py-2 mb-6 border border-rule dark:border-gray-700 bg-transparent text-ink dark:text-chalk focus:outline-hidden focus:border-ink dark:focus:border-chalk rounded-xs"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-ink-soft dark:text-gray-500 hover:text-ink dark:hover:text-chalk transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm bg-ink dark:bg-chalk text-white dark:text-ink hover:opacity-90 transition-opacity rounded-xs"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
