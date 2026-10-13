import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
      <pre className="text-accent text-sm leading-tight">{`  |\\__/,|   (\`\\
_.|o o  |_   ) )
-(((---(((--------`}</pre>
      <p className="text-accent/60 text-sm">404 — this page does not exist</p>
      <Link
        href="/"
        className="pointer-events-auto opacity-60 hover:opacity-100 transition-opacity text-sm text-accent"
      >
        home
      </Link>
    </div>
  );
}
