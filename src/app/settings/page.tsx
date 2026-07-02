export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] p-8">
      <h1 className="text-3xl font-bold text-[#5C2E0E]">Settings</h1>

      <div className="mt-8 bg-white rounded-xl p-6 shadow space-y-4">
        <label className="block">
          <span>Application Name</span>
          <input
            className="mt-2 w-full border rounded-lg p-2"
            defaultValue="ZATCA Multi-Agent"
          />
        </label>

        <label className="block">
          <span>Admin Email</span>
          <input
            className="mt-2 w-full border rounded-lg p-2"
            defaultValue="admin@example.com"
          />
        </label>

        <button className="bg-[#5C2E0E] text-white px-5 py-2 rounded-lg">
          Save Changes
        </button>
      </div>
    </main>
  );
}
