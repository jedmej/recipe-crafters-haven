
import React, { useState } from "react";
import { Check, Trash, MoreHorizontal } from "lucide-react";
import { Todo } from "@/components/recipes/recipe-display/types";

interface TodoItemProps {
  todo: Todo;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  showActions: boolean;
  onShowActions: () => void;
  onHideActions: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onComplete,
  onDelete,
  showActions,
  onShowActions,
  onHideActions,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
        todo.completed ? "bg-gray-100" : "bg-white"
      } ${isHovering ? "bg-gray-50" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        onHideActions();
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => onComplete(todo.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border ${
            todo.completed 
              ? "bg-green-500 border-green-500 text-white flex items-center justify-center" 
              : "border-gray-300"
          }`}
        >
          {todo.completed && <Check className="h-4 w-4" />}
        </button>
        
        <span className={`text-sm ${todo.completed ? "line-through text-gray-500" : ""}`}>
          {todo.title}
        </span>
      </div>
      
      <div className="flex items-center">
        {isHovering ? (
          <button
            onClick={onShowActions}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
          </button>
        ) : null}
        
        {showActions && (
          <div className="absolute right-8 bg-white shadow-lg rounded-md border p-1">
            <button
              onClick={() => onDelete(todo.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded w-full text-left"
            >
              <Trash className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
