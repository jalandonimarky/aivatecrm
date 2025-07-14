"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Assuming Button is available

// Sidebar Context
type SidebarState = "expanded" | "collapsed";

interface SidebarContextType {
  state: SidebarState;
  setSidebarState: React.Dispatch<React.SetStateAction<SidebarState>>;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setSidebarState] = React.useState<SidebarState>("expanded");

  const toggleSidebar = React.useCallback(() => {
    setSidebarState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  }, []);

  const value = React.useMemo(() => ({ state, setSidebarState, toggleSidebar }), [state, toggleSidebar]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Sidebar Component
const sidebarVariants = cva(
  "flex flex-col h-full transition-all duration-300 ease-in-out",
  {
    variants: {
      collapsible: {
        icon: "w-14", // Collapsed width
        default: "w-64", // Expanded width
      },
    },
    defaultVariants: {
      collapsible: "default",
    },
  }
);

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {
  collapsible?: "icon" | "default";
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible = "default", ...props }, ref) => {
    const { state } = useSidebar();
    const currentCollapsible = state === "collapsed" ? "icon" : "default";

    return (
      <aside
        ref={ref}
        className={cn(sidebarVariants({ collapsible: currentCollapsible }), className)}
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

// Sidebar Content
const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

// Sidebar Group
const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-6", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

// Sidebar Group Label
const SidebarGroupLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs font-semibold uppercase text-muted-foreground px-3 mb-2", className)}
    {...props}
  />
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

// Sidebar Group Content
const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

// Sidebar Menu
const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

// Sidebar Menu Item
const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

// Sidebar Menu Button (using shadcn Button)
interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  asChild?: boolean;
}

const SidebarMenuButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  SidebarMenuButtonProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      ref={ref}
      variant="ghost"
      className={cn(
        "w-full justify-start text-left px-3 py-2 h-auto",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

// Sidebar Trigger (for toggling)
const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn("h-8 w-8", className)}
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";


export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
};