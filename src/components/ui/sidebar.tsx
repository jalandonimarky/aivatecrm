import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Context
interface SidebarContextProps {
  state: "expanded" | "collapsed"
  setState: React.Dispatch<React.SetStateAction<"expanded" | "collapsed">>
}
const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<"expanded" | "collapsed">("expanded")
  return (
    <SidebarContext.Provider value={{ state, setState }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Components
export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { state } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn("relative flex h-full flex-col", className)}
        data-collapsed={state === "collapsed"}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-1 flex-col gap-4", className)} {...props} />
  )
)
SidebarContent.displayName = "SidebarContent"

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
  )
)
SidebarGroup.displayName = "SidebarGroup"

export const SidebarGroupLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("px-4 text-sm font-medium text-muted-foreground", className)} {...props} />
  )
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
)
SidebarGroupContent.displayName = "SidebarGroupContent"

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-col", className)} {...props} />
  )
)
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  (props, ref) => <li ref={ref} {...props} />
)
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = Button

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  ({ className, children, ...props }, ref) => {
    const { state, setState } = useSidebar()
    const isCollapsed = state === "collapsed"
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn("transition-all", className)}
        onClick={() => setState(isCollapsed ? "expanded" : "collapsed")}
        {...props}
      >
        {children}
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    )
  }
)
SidebarTrigger.displayName = "SidebarTrigger"