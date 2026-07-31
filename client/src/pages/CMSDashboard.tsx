import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, BarChart3, Package, FileText, Calendar, Mail, Image as ImageIcon, Settings } from "lucide-react";

export default function CMSDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: dashboardData, isLoading } = trpc.cms.dashboard.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">無法存取</h1>
          <p className="text-gray-600 mb-6">您沒有權限存取 CMS 後台。</p>
          <Link href="/">
            <Button>返回首頁</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">CMS 後台管理</h1>
          <p className="text-gray-600 mt-2">歡迎，{user?.name || "管理員"}！</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">服務項目</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalServices || 0}
                  </p>
                </div>
                <Package className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">案例</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalCases || 0}
                  </p>
                </div>
                <ImageIcon className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">文章</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalBlogs || 0}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">預約</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalBookings || 0}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">聯繫表單</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalContacts || 0}
                  </p>
                </div>
                <Mail className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">客戶評價</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {dashboardData?.totalReviews || 0}
                  </p>
                </div>
                <BarChart3 className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </Card>
          </div>
        )}

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Content Management */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">內容管理</h2>
            <div className="space-y-3">
              <Link href="/cms/pages">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  頁面管理
                </Button>
              </Link>
              <Link href="/cms/services">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  服務管理
                </Button>
              </Link>
              <Link href="/cms/cases">
                <Button variant="outline" className="w-full justify-start">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  案例管理
                </Button>
              </Link>
              <Link href="/cms/blogs">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  文章管理
                </Button>
              </Link>
            </div>
          </Card>

          {/* Business Management */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">業務管理</h2>
            <div className="space-y-3">
              <Link href="/cms/bookings">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  預約管理
                </Button>
              </Link>
              <Link href="/cms/contacts">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  聯繫表單
                </Button>
              </Link>
              <Link href="/cms/media">
                <Button variant="outline" className="w-full justify-start">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  媒體中心
                </Button>
              </Link>
              <Link href="/cms/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  網站設定
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">快速連結</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/">
              <Button variant="ghost" className="w-full">
                查看網站
              </Button>
            </Link>
            <Link href="/cms/seo">
              <Button variant="ghost" className="w-full">
                SEO 設定
              </Button>
            </Link>
            <Link href="/cms/menus">
              <Button variant="ghost" className="w-full">
                導覽列管理
              </Button>
            </Link>
            <Link href="/cms/faqs">
              <Button variant="ghost" className="w-full">
                FAQ 管理
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
