import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import InvoiceViewModal from "./InvoiceViewModal";

interface SubscriptionHistoryTableProps {
  subscriptions: any[];
  invoices: any[];
}

const SubscriptionHistoryTable: React.FC<SubscriptionHistoryTableProps> = ({
  subscriptions,
  invoices,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleViewInvoice = (subscription: any) => {
    const invoice = invoices?.find(inv => inv.subscription_id === subscription._id);
    if (invoice) {
      setSelectedInvoice(invoice);
      setShowInvoiceModal(true);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Subscription History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((subscription: any) => (
                  <TableRow key={subscription._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {subscription.number_of_days} days
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(subscription.subscription_start_date), "PP")} -{" "}
                          {format(new Date(subscription.subscription_end_date), "PP")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{subscription.number_of_users}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subscription.selected_modules?.slice(0, 2).map((module: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {module.module_name}
                          </Badge>
                        ))}
                        {subscription.selected_modules?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{subscription.selected_modules.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${subscription.total_amount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(subscription.payment_status)}>
                        {subscription.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(subscription)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoiceViewModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoice={selectedInvoice}
      />
    </>
  );
};

export default SubscriptionHistoryTable;