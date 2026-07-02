export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-[#FAF5EE] p-8">
      <h1 className="text-3xl font-bold text-[#5C2E0E]">Reports</h1>

      <table className="w-full bg-white rounded-xl shadow mt-8">
        <thead className="bg-[#5C2E0E] text-white">
          <tr>
            <th className="p-3">Invoice</th>
            <th>Status</th>
            <th>Risk</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td className="p-3">INV-1001</td>
            <td>Clean</td>
            <td>5%</td>
          </tr>

          <tr className="border-b">
            <td className="p-3">INV-1002</td>
            <td>Fraud</td>
            <td>95%</td>
          </tr>

          <tr>
            <td className="p-3">INV-1003</td>
            <td>Suspicious</td>
            <td>60%</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
