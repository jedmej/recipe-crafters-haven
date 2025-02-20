import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Edit, Trash, ListPlus } from "lucide-react";
import { UseMutationResult } from '@tanstack/react-query';

interface RecipeActionsProps {
  recipeId: string;
  isDeleting: boolean;
  handleDelete: () => Promise<void>;
  addToGroceryList: UseMutationResult<any, Error, void, any>;
}

export function RecipeActions({
  recipeId,
  isDeleting,
  handleDelete,
  addToGroceryList
}: RecipeActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <Link to={`/recipes/edit/${recipeId}`}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash className="h-4 w-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => addToGroceryList.mutate()}
        disabled={addToGroceryList.isPending}
      >
        <ListPlus className="h-4 w-4 mr-2" />
        {addToGroceryList.isPending ? 'Adding...' : 'Add to Grocery List'}
      </Button>
    </div>
  );
} 