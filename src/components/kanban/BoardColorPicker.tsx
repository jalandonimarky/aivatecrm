import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardColorPickerProps {
  currentColor?: string | null;
  onSelectColor: (color: string | null) => void;
}

const lightColors = [
  "#FDE68A", // light yellow
  "#BFDBFE", // light blue
  "#C7D2FE", // light indigo
  "#FBCFE8", // light pink
  "#D1FAE5", // light mint
  "#FEF9C3", // soft cream
];

export function BoardColorPicker({ currentColor, onSelectColor }: BoardColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {lightColors.map((color) => (
            <div
              key={color}
              className={cn(
                "w-8 h-8 rounded-full cursor-pointer border-2 border-transparent transition-all",
                currentColor === color && "border-primary ring-2 ring-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onSelectColor(color)}
              title={color}
            />
          ))}
          <div
            className={cn(
              "w-8 h-8 rounded-full cursor-pointer border-2 border-transparent flex items-center justify-center text-muted-foreground text-xs",
              !currentColor && "border-primary ring-2 ring-primary"
            )}
            style={{ backgroundColor: "hsl(var(--muted))" }}
            onClick={() => onSelectColor(null)}
            title="Clear Color"
          >
            <span className="text-xs">X</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}