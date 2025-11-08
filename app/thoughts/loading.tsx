export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="space-y-8">
        <div className="relative">
          <div className="mb-6 pb-2 border-b border-japanese-shiraumenezu dark:border-japanese-ginnezu/30">
            <div className="h-3 w-16 bg-japanese-sumiiro/10 dark:bg-japanese-shironezu/10 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 w-10 bg-japanese-sumiiro/10 dark:bg-japanese-shironezu/10 rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-japanese-sumiiro/10 dark:bg-japanese-shironezu/10 rounded animate-pulse w-full" />
                  <div className="h-3 bg-japanese-sumiiro/10 dark:bg-japanese-shironezu/10 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
