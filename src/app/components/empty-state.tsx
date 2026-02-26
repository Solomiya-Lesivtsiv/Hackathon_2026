import { Plane } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ 
  title = "No orders yet", 
  description = "Start by creating an order or importing a CSV file" 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <Plane className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/30"></div>
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
