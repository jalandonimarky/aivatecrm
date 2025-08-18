import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Receipt, Building2 } from "lucide-react";

const webApps = [
  {
    title: "Invoice Generator",
    description: "Create and manage professional invoices.",
    icon: Receipt,
    url: "https://aivateinvoicemaker.vercel.app/",
  },
  {
    title: "Bridgekey Housing Solution Lead Tracker",
    description: "Tool for lead client tracker.",
    icon: Building2,
    url: "https://bridgekey-ltt.vercel.app/login",
  },
];

export function WebApplications() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApps = webApps.filter(app =>
    app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-accent dark:text-primary">
          Web Applications
        </h1>
        <p className="text-muted-foreground">
          Tools and applications to streamline your workflow.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.length > 0 ? (
          filteredApps.map((app, index) => (
            <a
              key={index}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:no-underline"
            >
              <Card className="bg-gradient-card border-border/50 hover:shadow-medium transition-smooth h-full flex flex-col">
                <CardHeader className="flex-row items-center space-x-4 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl shadow-glow">
                    <app.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{app.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm">{app.description}</p>
                </CardContent>
              </Card>
            </a>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              No applications found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
