export const DashboardNoMatchState = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 px-6 text-center">
    <h2 className="text-lg font-semibold text-gray-900">No charts found</h2>
    <p className="mt-2 text-sm text-gray-600">
      No charts match &ldquo;{query}&rdquo;.
    </p>
  </div>
);
