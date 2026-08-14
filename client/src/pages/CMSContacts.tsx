import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, Phone, CheckCircle } from "lucide-react";
import { AsyncFeedback } from "@/components/AsyncFeedback";

export default function CMSContacts() {
  const { user, isAuthenticated } = useAuth();
  const [actionError, setActionError] = useState("");
  const [updatingContactId, setUpdatingContactId] = useState<number | null>(null);

  const { data: contacts, isLoading, error: listError, refetch } = trpc.cms.contacts.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "manager", "customer_service"].includes(user?.role || ""),
  });

  const markAsReadMutation = trpc.cms.contacts.markAsRead.useMutation({
    onSuccess: () => {
      setActionError("");
      refetch();
    },
    onError: (error) => setActionError(error.message || "無法更新訊息狀態，請稍後再試。"),
    onSettled: () => setUpdatingContactId(null),
  });

  if (!isAuthenticated || !["admin", "manager", "customer_service"].includes(user?.role || "")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">無法存取此頁面</p>
      </div>
    );
  }

  const unreadCount = contacts?.filter((c) => !c.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">聯繫表單</h1>
          <p className="text-gray-600 mt-2">
            共 {contacts?.length || 0} 筆訊息 {unreadCount > 0 && `(${unreadCount} 筆未讀)`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AsyncFeedback isPending={markAsReadMutation.isPending} pendingLabel="正在更新訊息狀態…" errorMessage={actionError || (listError ? "無法載入聯繫訊息，請重新整理後再試。" : undefined)} />
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className={`p-6 ${!contact.isRead ? "border-l-4 border-l-blue-500" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                      {!contact.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(contact.createdAt).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!contact.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUpdatingContactId(contact.id);
                        markAsReadMutation.mutate({ id: contact.id });
                      }}
                      disabled={markAsReadMutation.isPending}
                    >
                      {updatingContactId === contact.id ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />更新中…</> : <><CheckCircle className="w-4 h-4 mr-1" />標記為已讀</>}
                    </Button>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {contact.phone ? (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a href={`tel:${contact.phone}`} className="hover:text-primary hover:underline">{contact.phone}</a>
                    </div>
                  ) : <p className="text-sm text-gray-500">未提供電話</p>}
                  {contact.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {!contact.email && <p className="text-sm text-gray-500">未提供 Email</p>}
                </div>

                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-2">訊息內容：</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600">無聯繫訊息</p>
          </Card>
        )}
      </div>
    </div>
  );
}
