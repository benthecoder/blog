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
      <div className="bg-paper dark:bg-night border border-rule dark:border-night-rule p-8 max-w-md mx-4">
        <h2 className="text-lg font-light mb-4 text-ink dark:text-chalk tracking-wide">
          {config.title}
        </h2>
        <p className="text-sm text-ink-soft dark:text-chalk-muted mb-8">
          {config.message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-rule dark:border-night-rule text-ink dark:text-chalk hover:border-ink dark:hover:border-chalk transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={config.onConfirm}
            className="px-4 py-1.5 text-sm border border-ink dark:border-chalk text-ink dark:text-chalk hover:bg-ink hover:text-white dark:hover:bg-chalk dark:hover:text-night transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
