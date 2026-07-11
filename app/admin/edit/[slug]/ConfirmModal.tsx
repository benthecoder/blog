"use client";

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  config,
  onCancel,
}: {
  config: ConfirmConfig;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 border border-japanese-shiraumenezu dark:border-gray-700 p-8 max-w-md mx-4">
        <h2 className="text-lg font-light mb-4 text-japanese-sumiiro dark:text-japanese-shironezu tracking-wide">
          {config.title}
        </h2>
        <p className="text-sm text-japanese-ginnezu dark:text-gray-400 mb-8">
          {config.message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-japanese-shiraumenezu dark:border-gray-700 text-japanese-sumiiro dark:text-japanese-shironezu hover:border-japanese-sumiiro dark:hover:border-japanese-shironezu transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={config.onConfirm}
            className="px-4 py-1.5 text-sm border border-japanese-sumiiro dark:border-japanese-shironezu text-japanese-sumiiro dark:text-japanese-shironezu hover:bg-japanese-sumiiro hover:text-white dark:hover:bg-japanese-shironezu dark:hover:text-japanese-sumiiro transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
