export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] p-8">
      <h1 className="text-3xl font-bold text-[#5C2E0E]">
        Notifications
      </h1>

      <div className="mt-8 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
          New invoice uploaded successfully.
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          Fraud detected in Invoice INV-1002.
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          AI analysis completed.
        </div>
      </div>
    </main>
  );
}
