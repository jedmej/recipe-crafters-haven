import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChefHat, ShoppingCart, Plus, X, Sparkle, Robot, TextT } from "@phosphor-icons/react"

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  const addMenuItems = [
    {
      label: "Inspire Me",
      icon: Sparkle,
      onClick: () => navigate("/recipes/inspire"),
    },
    {
      label: "Import from URL",
      icon: Robot,
      onClick: () => navigate("/recipes/import-ai"),
    },
    {
      label: "Add Recipe",
      icon: TextT,
      onClick: () => navigate("/recipes/new"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-background/80 backdrop-blur-lg border-t pb-6 lg:pb-2 pt-2">
        <div className="flex items-center justify-around h-16 px-4 max-w-screen-xl mx-auto">
          <Link
            to="/recipes"
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              location.pathname.startsWith("/recipes") 
                ? "text-[#FA8923]" 
                : "text-muted-foreground hover:text-[#FA8923]"
            )}
          >
            <ChefHat 
              size={24} 
              weight="duotone" 
              className={cn(
                location.pathname.startsWith("/recipes") 
                  ? "text-[#FA8923]" 
                  : "text-muted-foreground hover:text-[#FA8923]"
              )}
            />
            <span>Recipes</span>
          </Link>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full bg-[#FA8923] text-white hover:bg-[#FA8923] hover:text-white hover:opacity-90 relative",
                  open && "bg-[#FA8923] text-white"
                )}
              >
                <div className="relative w-6 h-6">
                  <X 
                    size={24}
                    weight="regular"
                    className={cn(
                      "text-[#fff] absolute top-0 left-0 transition-all duration-300 ease-in-out",
                      open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                    )} 
                  />
                  <Plus 
                    size={24}
                    weight="regular"
                    className={cn(
                      "text-[#fff] absolute top-0 left-0 transition-all duration-300 ease-in-out",
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
              sideOffset={24}
            >
              <div className="grid divide-y divide-[#000]/5">
                {addMenuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-3 py-8 px-4 text-lg group hover:bg-[#FA8923]/5 first:pt-4 last:pb-4 transition-colors"
                    onClick={() => {
                      item.onClick()
                      setOpen(false)
                    }}
                  >
                    <item.icon className="h-6 w-6 transition-colors text-muted-foreground group-hover:text-[#FA8923]" weight="duotone" />
                    <span className="transition-colors text-foreground group-hover:text-[#FA8923]">{item.label}</span>
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
                ? "text-[#FA8923]" 
                : "text-muted-foreground hover:text-[#FA8923]"
            )}
          >
            <ShoppingCart 
              size={24} 
              weight="duotone" 
              className={cn(
                location.pathname.startsWith("/grocery-lists") 
                  ? "text-[#FA8923]" 
                  : "text-muted-foreground hover:text-[#FA8923]"
              )}
            />
            <span>Groceries</span>
          </Link>
        </div>
      </div>
    </div>
  )
} 