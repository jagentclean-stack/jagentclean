import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface TestimonialCardProps {
  name: string;
  title: string;
  quote: string;
  avatarSrc?: string;
}

export default function TestimonialCard({ name, title, quote, avatarSrc }: TestimonialCardProps) {
  return (
    <Card className="glassmorphism soft-shadow p-6 text-left hover:shadow-lg transition-all duration-300 ease-out group">
      <CardContent className="p-0">
        <p className="text-lg leading-relaxed mb-6 italic text-muted-foreground group-hover:text-foreground transition-colors duration-300">"{ quote}"</p>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarSrc} alt={`${name}'s avatar`} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-primary">{name}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
