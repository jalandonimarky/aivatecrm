import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  optionsMenu?: React.ReactNode; // For the three-dotted menu
  storageKey: string; // For persistence
  defaultOpen?: boolean; // Initial state if no stored state
}

export function CollapsibleCard({
  title,
  children,
  optionsMenu,
  storageKey,
  defaultOpen = true,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedState = localStorage.getItem(storageKey);
        return storedState !== null ? JSON.parse(storedState) : defaultOpen;
      } catch (e) {
        console.error("Failed to parse stored state from localStorage", e);
        return defaultOpen;
      }
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(isOpen));
      } catch (e) {
        console.error("Failed to save state to localStorage", e);
      }
    }
  }, [isOpen, storageKey]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={toggleOpen}>
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <CardTitle className="text-lg font-semibold flex-1 min-w-0 pr-2 break-words">
            {title}
          </CardTitle>
          <ChevronDown className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )} />
        </div>
        {optionsMenu && (
          <div onClick={(e) => e.stopPropagation()}> {/* Prevent toggle when clicking menu */}
            {optionsMenu}
          </div>
        )}
      </CardHeader>
      <div className={cn(
        "grid overflow-hidden transition-all duration-200 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <CardContent className="overflow-hidden pt-4">
          {children}
        </CardContent>
      </div>
    </Card>
  );
}