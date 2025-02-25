import { FileText } from "lucide-react";

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No recipes found</h3>
      <p className="mt-2 text-gray-600">
        Get started by creating a new recipe
      </p>
    </div>
  );
} 