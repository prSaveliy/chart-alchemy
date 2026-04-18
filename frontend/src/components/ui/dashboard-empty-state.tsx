import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const DashboardEmptyState = ({
  onCreate,
}: {
  onCreate: () => void;
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 px-6 text-center">
    <h2 className="text-lg font-semibold text-gray-900">No charts yet</h2>
    <p className="mt-2 text-sm text-gray-600 max-w-md">
      Create your first chart with AI or build one manually to see it listed
      here.
    </p>
    <Button className="mt-6 cursor-pointer" onClick={onCreate}>
      <Plus strokeWidth={1.5} className="w-4 h-4" />
      New Chart
    </Button>
  </div>
);
