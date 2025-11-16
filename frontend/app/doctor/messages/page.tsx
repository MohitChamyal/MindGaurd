import { SecureChat } from "@/components/patient/secure-chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | MindGuard",
  description: "Securely message your patients",
};

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with your patients securely
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <SecureChat />
      </div>
    </div>
  );
}
