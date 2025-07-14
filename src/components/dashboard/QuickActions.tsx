import { Plus, Users, Briefcase, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add Contact",
      icon: Users,
      color: "hsl(var(--accent))",
      action: () => navigate("/contacts?new=true"),
    },
    {
      title: "Create Deal",
      icon: Briefcase,
      color: "hsl(var(--primary))",
      action: () => navigate("/deals?new=true"),
    },
    {
      title: "New Task",
      icon: CheckSquare,
      color: "hsl(var(--success))",
      action: () => navigate("/tasks?new=true"),
    },
  ];

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            variant="ghost"
            className="w-full justify-start space-x-3 h-12 hover:bg-muted/50 transition-smooth group"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-spring"
              style={{ backgroundColor: action.color }}
            >
              <action.icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">{action.title}</span>
            <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-smooth" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}