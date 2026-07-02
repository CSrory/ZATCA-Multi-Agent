export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] p-8">
      <h1 className="text-3xl font-bold text-[#5C2E0E]">
        Invoice Records
      </h1>

      <div className="mt-8 bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-[#5C2E0E] text-white">
            <tr>
              <th className="p-3">Invoice ID</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="p-3">INV001</td>
              <td>2026-07-01</td>
              <td>Verified</td>
            </tr>

            <tr className="border-b">
              <td className="p-3">INV002</td>
              <td>2026-07-02</td>
              <td>Fraud</td>
            </tr>

            <tr>
              <td className="p-3">INV003</td>
              <td>2026-07-03</td>
              <td>Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
