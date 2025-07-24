import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"; // Import DropdownMenuItem
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
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        {/* This DropdownMenuItem will now act as the PopoverTrigger */}
        <DropdownMenuItem 
          onSelect={(e) => e.preventDefault()} // Prevent DropdownMenu from closing
          className="cursor-pointer" // Ensure it looks clickable
        >
          <Palette className="mr-2 h-4 w-4" />
          <span>Change Board Color</span>
        </DropdownMenuItem>
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
              onClick={() => {
                onSelectColor(color);
                setPopoverOpen(false); // Close popover after selection
              }}
              title={color}
            />
          ))}
          <div
            className={cn(
              "w-8 h-8 rounded-full cursor-pointer border-2 border-transparent flex items-center justify-center text-muted-foreground text-xs",
              !currentColor && "border-primary ring-2 ring-primary"
            )}
            style={{ backgroundColor: "hsl(var(--muted))" }}
            onClick={() => {
              onSelectColor(null);
              setPopoverOpen(false); // Close popover after selection
            }}
            title="Clear Color"
          >
            <span className="text-xs">X</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}