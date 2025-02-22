import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChefHat, Plus, X, ShoppingCart, Search, Bot, FileText, Sparkles } from "lucide-react"

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
      label: "Inspire Me",
      icon: Sparkles,
      onClick: () => navigate("/recipes/inspire"),
    },
    {
      label: "Add Recipe",
      icon: FileText,
      onClick: () => navigate("/recipes/new"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/80 backdrop-blur-lg border-t pb-6">
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
                variant="default"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full border-2 bg-[#0C111D] text-white border-primary hover:bg-[#0C111D] hover:text-white hover:opacity-100 relative",
                  open && "bg-[#0C111D] text-white border-primary"
                )}
              >
                <div className="relative w-6 h-6">
                  <X 
                    className={cn(
                      "h-6 w-6 text-[#fff] absolute top-0 left-0 transition-all duration-300 ease-in-out",
                      open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                    )} 
                  />
                  <Plus 
                    className={cn(
                      "h-6 w-6 text-[#fff] absolute top-0 left-0 transition-all duration-300 ease-in-out",
                      open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                    )} 
                  />
                </div>
                <span className="sr-only">{open ? 'Close menu' : 'Add'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-screen max-w-[280px] p-4 rounded-3xl bg-background/80 backdrop-blur-lg border shadow-lg" 
              align="center"
              side="top"
              sideOffset={16}
            >
              <div className="grid divide-y divide-[#000]/5">
                {addMenuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-3 py-8 px-4 text-lg hover:bg-transparent first:pt-4 last:pb-4"
                    onClick={() => {
                      item.onClick()
                      setOpen(false)
                    }}
                  >
                    <item.icon className="h-6 w-6" />
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