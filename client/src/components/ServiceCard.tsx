import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <Card className="glassmorphism soft-shadow hover:scale-[1.02] hover:shadow-lg transition-all duration-300 ease-out group">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="p-3 rounded-full bg-secondary/20 text-secondary group-hover:bg-secondary/30 transition-colors duration-300">
          <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
