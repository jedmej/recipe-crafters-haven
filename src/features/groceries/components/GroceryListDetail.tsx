import { useParams } from "react-router-dom";
import { useGroceryList } from "../hooks/useGroceryList";
import { GroceryListHeader } from "./GroceryListHeader";
import { GroceryListItems } from "./GroceryListItems";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function GroceryListDetail() {
  const { id } = useParams<{ id: string }>();
  const { list, isLoading, deleteList, updateImage, toggleItem, recategorizeItems } = useGroceryList(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Grocery List Not Found</h1>
        <p className="mt-2 text-gray-600">
          The grocery list you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GroceryListHeader
        title={list.title}
        imageUrl={list.image_url}
        recipeId={list.recipe?.id}
        recipeTitle={list.recipe?.title}
        onDelete={() => deleteList.mutate()}
        onUpdateImage={(url) => updateImage.mutate(url)}
        onRecategorize={recategorizeItems}
      />

      <GroceryListItems
        items={list.items}
        onToggleItem={toggleItem}
      />
    </div>
  );
} 