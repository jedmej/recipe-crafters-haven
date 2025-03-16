import { MasterGroceryList } from "@/features/groceries/components/MasterGroceryList";

export default function GroceryListsPage() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen px-0 py-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 pl-6 pt-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Grocery Lists
          </h1>
        </header>

        {/* Master Grocery List Component */}
        <MasterGroceryList />
      </div>
    </div>
  );
}
