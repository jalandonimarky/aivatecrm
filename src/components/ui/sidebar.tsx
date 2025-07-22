"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

interface SidebarContextProps {
  state: "expanded" | "collapsed"
  setState: React.Dispatch<React.SetStateAction<"expanded" | "collapsed">>
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
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

const sidebarVariants = cva("transition-all duration-300 ease-in-out", {
  variants: {
    collapsible: {
      icon: "",
      none: "",
    },
  },
  defaultVariants: {
    collapsible: "none",
  },
})

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible, ...props }, ref) => {
    const isMobile = useIsMobile()
    const { state } = useSidebar()

    if (isMobile) {
      return (
        <Drawer direction="left">
          {props.children}
        </Drawer>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          sidebarVariants({ collapsible }),
          state === "collapsed" && "w-14",
          state === "expanded" && "w-64",
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof DrawerTrigger>,
  React.ComponentPropsWithoutRef<typeof DrawerTrigger> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const isMobile = useIsMobile()
  const { setState } = useSidebar()

  const toggleSidebar = () => {
    setState((prevState) => (prevState === "expanded" ? "collapsed" : "expanded"))
  }

  const Comp = asChild ? Slot : "button"

  if (isMobile) {
    return <DrawerTrigger ref={ref} className={cn(className)} {...props} asChild={asChild} />
  }

  return (
    <Comp
      ref={ref as React.Ref<any>}
      className={cn(className)}
      onClick={toggleSidebar}
      {...props}
    />
  )
})
SidebarTrigger.displayName = "SidebarTrigger"


const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("h-full w-64 p-0", className)}
        {...props}
      />
    )
  }

  return <div ref={ref} className={cn("h-full", className)} {...props} />
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col", className)} {...props} />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar()
  return (
    <p
      ref={ref}
      className={cn(
        "px-4 py-2 text-xs font-medium text-muted-foreground",
        state === "collapsed" && "px-2 text-center sr-only",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col", className)} {...props} />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-col", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? "span" : "button"
  return (
    <Comp
      ref={ref as React.Ref<any>}
      className={cn(
        "flex w-full items-center justify-start rounded-md px-3 py-2 text-sm font-medium",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}