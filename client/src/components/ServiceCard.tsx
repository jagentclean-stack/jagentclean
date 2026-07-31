import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <Card className="border-0 bg-white soft-shadow hover:shadow-lg transition-all duration-300 ease-out group">
      <CardContent className="p-8 flex flex-col items-start space-y-6">
        {/* 圓形綠色背景圖標 */}
        <div 
          className="rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#E8F5E9', // 淺綠色背景
            color: '#8CC63F' // 萊姆綠
          }}
        >
          <Icon className="h-10 w-10" />
        </div>
        
        {/* 標題 */}
        <h3 className="text-xl font-bold text-primary">{title}</h3>
        
        {/* 描述 */}
        <p className="text-gray-600 text-base leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
