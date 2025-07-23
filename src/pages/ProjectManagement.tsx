import React from "react";
import { Outlet } from "react-router-dom";
import { KanbanBoards } from "./KanbanBoards"; // Import the unified KanbanBoards component

export function ProjectManagement() {
  return (
    <div className="space-y-6">
      {/* The title and description are now handled within KanbanBoards.tsx */}
      <Outlet /> {/* This will render KanbanBoards as the default child route */}
    </div>
  );
}