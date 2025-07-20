import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"; // Added Check, ChevronsUpDown
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Deal, Profile } from "@/types/crm"; // Import Profile

import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

interface RallyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (date: Date, time: string, note: string, participants: { fullName: string; email: string }[]) => Promise<void>; // Updated onSubmit signature
  deal: Deal;
  profiles: Profile[]; // New prop
  getFullName: (profile: Profile) => string; // New prop
}

const generateTimeOptions = () => {
  const times = [];
  for (let i = 8; i <= 18; i++) { // 8 AM to 6 PM
    times.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 18) { // Don't add 6:30 PM
      times.push(`${String(i).padStart(2, '0')}:30`);
    }
  }
  return times;
};

export function RallyDialog({ isOpen, onOpenChange, onSubmit, deal, profiles, getFullName }: RallyDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [noteDescription, setNoteDescription] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]); // New state for selected participants

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setSelectedDate(undefined);
      setSelectedTime("");
      setNoteDescription("");
      setSelectedParticipantIds([]); // Reset participants
      setLoading(false);
    }
  }, [isOpen]);

  const handleParticipantToggle = (profileId: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !noteDescription.trim()) {
      // Basic validation
      alert("Please fill in all fields: Date, Time, and Note Description.");
      return;
    }

    // Map selected participant IDs to their full names and emails
    const participantsData = selectedParticipantIds.map(id => {
      const profile = profiles.find(p => p.id === id);
      return {
        fullName: profile ? getFullName(profile) : "Unknown User",
        email: profile ? profile.email : "unknown@example.com",
      };
    });

    setLoading(true);
    try {
      await onSubmit(selectedDate, selectedTime, noteDescription, participantsData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Rally for "{deal.title}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rally-date">Date *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date || undefined);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rally-time">Time *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Participants Multi-Select Field */}
          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedParticipantIds.length > 0
                    ? `${selectedParticipantIds.length} selected`
                    : "Select participants..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {profiles.map(profile => (
                      <CommandItem
                        key={profile.id}
                        onSelect={() => handleParticipantToggle(profile.id)}
                        className="cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedParticipantIds.includes(profile.id)}
                          onCheckedChange={() => handleParticipantToggle(profile.id)}
                          className="mr-2"
                        />
                        {getFullName(profile)}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedParticipantIds.includes(profile.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-description">Note Description *</Label>
            <Textarea
              id="note-description"
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
              placeholder="Enter details for the rally..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={loading}>
              {loading ? "Sending..." : "Send Rally"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}