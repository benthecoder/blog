export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-auto bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}
