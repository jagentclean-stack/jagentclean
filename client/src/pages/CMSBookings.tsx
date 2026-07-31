import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Phone, Mail, MapPin, Calendar } from "lucide-react";

type BookingStatus = "pending" | "quoted" | "in_progress" | "completed" | "cancelled";

const statusLabels: Record<BookingStatus, string> = {
  pending: "待聯絡",
  quoted: "已報價",
  in_progress: "施工中",
  completed: "完成",
  cancelled: "取消",
};

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CMSBookings() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const { data: bookings, isLoading, refetch } = trpc.cms.bookings.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "manager", "customer_service"].includes(user?.role || ""),
  });

  const updateMutation = trpc.cms.bookings.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  if (!isAuthenticated || !["admin", "manager", "customer_service"].includes(user?.role || "")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">無法存取此頁面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">預約管理</h1>
          <p className="text-gray-600 mt-2">共 {filteredBookings?.length || 0} 筆預約</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">按狀態篩選：</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待聯絡</SelectItem>
                <SelectItem value="quoted">已報價</SelectItem>
                <SelectItem value="in_progress">施工中</SelectItem>
                <SelectItem value="completed">完成</SelectItem>
                <SelectItem value="cancelled">取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : filteredBookings && filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{booking.name}</h3>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[booking.status as BookingStatus]
                    }`}>
                      {statusLabels[booking.status as BookingStatus]}
                    </span>
                  </div>
                  <Select
                    value={booking.status || "pending"}
                    onValueChange={(value) =>
                      updateMutation.mutate({
                        id: booking.id,
                        status: value as BookingStatus,
                      })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待聯絡</SelectItem>
                      <SelectItem value="quoted">已報價</SelectItem>
                      <SelectItem value="in_progress">施工中</SelectItem>
                      <SelectItem value="completed">完成</SelectItem>
                      <SelectItem value="cancelled">取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {booking.phone}
                  </div>
                  {booking.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {booking.email}
                    </div>
                  )}
                  {booking.address && (
                    <div className="flex items-start text-gray-600 col-span-2">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {booking.address}
                    </div>
                  )}
                  {booking.bookingDate && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(booking.bookingDate).toLocaleDateString("zh-TW")}
                    </div>
                  )}
                </div>

                {booking.requirements && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                    <p className="font-medium mb-1">需求：</p>
                    <p>{booking.requirements}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600">無預約資料</p>
          </Card>
        )}
      </div>
    </div>
  );
}
