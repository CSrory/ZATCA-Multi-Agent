export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] p-8">
      <h1 className="text-3xl font-bold text-[#5C2E0E]">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-bold">Users</h2>
          <p className="text-4xl mt-4">24</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-bold">Invoices</h2>
          <p className="text-4xl mt-4">125</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-bold">Fraud Cases</h2>
          <p className="text-4xl mt-4 text-red-600">9</p>
        </div>
      </div>
    </main>
  );
}
