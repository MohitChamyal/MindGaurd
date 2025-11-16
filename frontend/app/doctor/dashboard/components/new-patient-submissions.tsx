import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

interface SubmissionProps {
  pendingRegistrations: Array<{
    id: string;
    senderName: string;
    content: string;
    time: string;
    isUnread: boolean;
  }>;
}

export function NewPatientSubmissions({ pendingRegistrations }: SubmissionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Pending Patient Registrations
        </CardTitle>
        <Link href="/doctor/patients/pending">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {pendingRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No pending registrations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRegistrations.slice(0, 4).map((registration) => (
              <div key={registration.id} className="relative flex gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{registration.senderName}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {registration.content}
                  </p>
                </div>
                <div className="ml-auto flex h-full flex-col justify-between text-right">
                  <span className="text-xs text-muted-foreground">
                    {registration.time}
                  </span>
                  {registration.isUnread && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 