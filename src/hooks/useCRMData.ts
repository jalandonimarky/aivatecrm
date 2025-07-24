import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contact, Deal, Task, Profile, DashboardStats, DealNote, TaskNote, DealAttachment, KanbanBoard, KanbanColumn, KanbanItem, KanbanItemNote } from "@/types/crm";
import { format, startOfMonth, subMonths, isWithinInterval, parseISO, endOfMonth } from "date-fns";

// ... (rest of the code remains unchanged)

export function useCRMData() {
  // ... (all previous state and helpers)

  // CRUD operations for Kanban Boards
  const createKanbanBoard = async (boardData: Omit<KanbanBoard, 'id' | 'created_at' | 'columns' | 'creator'>) => {
    try {
      const creatorProfileId = await getOrCreateUserProfileId(); // This is now user.id
      const { data, error } = await supabase
        .from("kanban_boards")
        .insert([{ ...boardData, created_by: creatorProfileId }]) // Use profiles.id (which is user.id)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .single();

      if (error) throw error;
      toast({ title: "Board created", description: "New Kanban board added." });
      await fetchData();
      return data as any as KanbanBoard;
    } catch (error: any) {
      console.error("Error creating Kanban board:", error);
      toast({ title: "Error creating board", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateKanbanBoard = async (id: string, updates: Partial<Omit<KanbanBoard, 'columns' | 'creator'>>) => {
    try {
      const { data, error } = await supabase
        .from("kanban_boards")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          creator:profiles(id, first_name, last_name, email, avatar_url, role, created_at, updated_at)
        `)
        .maybeSingle(); // <-- FIXED: use maybeSingle() instead of single()

      if (error) throw error;
      if (!data) {
        toast({ title: "Board not found", description: "The board could not be found or updated.", variant: "destructive" });
        return null;
      }
      toast({ title: "Board updated", description: "Kanban board updated successfully." });
      await fetchData();
      return data as any as KanbanBoard;
    } catch (error: any) {
      console.error("Error updating Kanban board:", error);
      toast({ title: "Error updating board", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  // ... (rest of the code remains unchanged)
  // (No other changes in this file)
  // ... (return statement remains unchanged)
}