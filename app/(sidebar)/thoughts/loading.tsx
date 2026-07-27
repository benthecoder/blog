export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-8">
        <div className="relative">
          <div className="mb-6 pb-2 border-b border-rule dark:border-ink-soft/30">
            <div className="h-3 w-16 bg-ink/10 dark:bg-chalk/10 rounded-sm animate-pulse" />
          </div>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 w-10 bg-ink/10 dark:bg-chalk/10 rounded-sm animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-ink/10 dark:bg-chalk/10 rounded-sm animate-pulse w-full" />
                  <div className="h-3 bg-ink/10 dark:bg-chalk/10 rounded-sm animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
