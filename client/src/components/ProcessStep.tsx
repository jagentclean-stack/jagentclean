import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessStepProps {
  stepNumber: number;
  title: string;
  description: string;
}

export default function ProcessStep({ stepNumber, title, description }: ProcessStepProps) {
  return (
    <Card className="glassmorphism soft-shadow p-6 text-center">
      <CardHeader className="flex flex-col items-center justify-center p-0 mb-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-primary-foreground text-xl font-bold mb-4">
          {stepNumber}
        </div>
        <CardTitle className="text-2xl font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
