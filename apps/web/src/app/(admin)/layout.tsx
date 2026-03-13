export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-teal-700 text-white px-6 py-4">
        <span className="font-bold text-xl">KURA Back Office</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
