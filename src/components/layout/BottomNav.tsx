import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChefHat, Plus, ShoppingCart, Search, Bot, FileText } from "lucide-react"

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  const addMenuItems = [
    {
      label: "AI Search",
      icon: Search,
      onClick: () => navigate("/recipes/ai-search"),
    },
    {
      label: "Import from URL",
      icon: Bot,
      onClick: () => navigate("/recipes/import-ai"),
    },
    {
      label: "Add Recipe",
      icon: FileText,
      onClick: () => navigate("/recipes/new"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/80 backdrop-blur-lg border-t">
        <div className="flex items-center justify-around h-16 px-4 max-w-screen-xl mx-auto">
          <Link
            to="/recipes"
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              location.pathname.startsWith("/recipes") 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <ChefHat className="h-6 w-6" />
            <span>Recipes</span>
          </Link>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full border-2",
                  open && "bg-accent text-accent-foreground border-primary"
                )}
              >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Add</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-screen max-w-[280px] p-2" 
              align="center"
              side="top"
              sideOffset={16}
            >
              <div className="grid gap-2">
                {addMenuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      item.onClick()
                      setOpen(false)
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Link
            to="/grocery-lists"
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              location.pathname.startsWith("/grocery-lists") 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <ShoppingCart className="h-6 w-6" />
            <span>Groceries</span>
          </Link>
        </div>
      </div>
    </div>
  )
} 