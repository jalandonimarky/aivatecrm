import React, { useState, useMemo } from "react";
import { useCRMData } from "@/hooks/useCRMData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, List, LayoutGrid, ArrowLeft } from "lucide-react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { ProjectTaskFormDialog } from "@/components/projects/ProjectTaskFormDialog";
import { TaskMatrixListView } from "@/components/projects/TaskMatrixListView";
import { TaskMatrixBoardView } from "@/components/projects/TaskMatrixBoardView";
import { ProjectTaskDetailPanel } from "@/components/projects/ProjectTaskDetailPanel"; // Import the new component
import type { Project, ProjectTask } from "@/types/crm";

export function TaskMatrix() {
  const {
    projects,
    profiles,
    loading,
    createProject,
    updateProject,
    createProjectTask,
    updateProjectTask,
    reorderProjectTasks,
    moveProjectTask,
    getFullName,
  } = useCRMData();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false); // State for detail panel
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<ProjectTask | null>(null); // State for task in detail panel

  const sectionOrder: ProjectTask['section'][] = ["To Do", "Doing", "Done"];

  const tasksBySection = useMemo(() => {
    if (!selectedProject || !selectedProject.tasks) return {};
    return selectedProject.tasks.reduce((acc, task) => {
      const section = task.section || "To Do";
      if (!acc[section]) acc[section] = [];
      acc[section].push(task);
      return acc;
    }, {} as { [key: string]: ProjectTask[] });
  }, [selectedProject]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (destination.droppableId === source.droppableId) {
      // Reordering within the same section
      reorderProjectTasks(draggableId, source.droppableId as ProjectTask['section'], destination.index);
    } else {
      // Moving to a different section
      moveProjectTask(draggableId, source.droppableId as ProjectTask['section'], destination.droppableId as ProjectTask['section'], destination.index);
    }
  };

  const handleProjectSubmit = async (data: { name: string; status: Project['status'] }) => {
    if (editingProject) {
      await updateProject(editingProject.id, data);
    } else {
      await createProject(data);
    }
  };

  const handleTaskSubmit = async (data: any) => {
    if (!selectedProject) return;
    if (editingTask) {
      await updateProjectTask(editingTask.id, data);
    } else {
      await createProjectTask({ ...data, project_id: selectedProject.id });
    }
  };

  const handleOpenTaskDetail = (task: ProjectTask) => {
    setSelectedTaskForDetail(task);
    setIsDetailPanelOpen(true);
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Select a Project</h1>
          <Button onClick={() => { setEditingProject(null); setIsProjectFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProject(p)}>
              <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
              <CardContent><p>{p.status}</p><p>{p.tasks?.length || 0} tasks</p></CardContent>
            </Card>
          ))}
        </div>
        <ProjectFormDialog isOpen={isProjectFormOpen} onOpenChange={setIsProjectFormOpen} onSubmit={handleProjectSubmit} initialData={editingProject} />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setSelectedProject(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button>
          <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'board' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('board')}><LayoutGrid className="h-4 w-4" /></Button>
            <Button onClick={() => { setEditingTask(null); setIsTaskFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
          </div>
        </div>
        {viewMode === 'list' ? (
          <TaskMatrixListView tasksBySection={tasksBySection} sectionOrder={sectionOrder} onOpenDetail={handleOpenTaskDetail} />
        ) : (
          <TaskMatrixBoardView tasksBySection={tasksBySection} sectionOrder={sectionOrder} onOpenDetail={handleOpenTaskDetail} />
        )}
      </div>
      <ProjectTaskFormDialog isOpen={isTaskFormOpen} onOpenChange={setIsTaskFormOpen} onSubmit={handleTaskSubmit} initialData={editingTask} profiles={profiles} getFullName={getFullName} />
      
      {/* Task Detail Side Panel */}
      <ProjectTaskDetailPanel
        isOpen={isDetailPanelOpen}
        onOpenChange={setIsDetailPanelOpen}
        task={selectedTaskForDetail}
        profiles={profiles}
        getFullName={getFullName}
      />
    </DragDropContext>
  );
}