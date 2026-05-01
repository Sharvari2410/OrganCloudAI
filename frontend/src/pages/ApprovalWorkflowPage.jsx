import { useEffect, useState } from "react";
import { fetchApprovalWorkflow } from "../api/client";
import ApprovalStepper from "../components/ApprovalStepper";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { emitSocket, subscribeSocket } from "../realtime/socket";

function ApprovalWorkflowPage() {
  const [rows, setRows] = useState([]);

  const loadWorkflow = async () => {
    const data = await fetchApprovalWorkflow();
    setRows(data);
  };

  useEffect(() => {
    loadWorkflow();
    emitSocket("subscribe:approval");

    const unsubscribers = [
      subscribeSocket("approval:updated", loadWorkflow),
      subscribeSocket("entity:changed", (payload) => {
        if (["approval", "donation_request"].includes(payload?.entity)) {
          loadWorkflow();
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Dynamic Approval Pipeline" subtitle="Doctor -> Hospital -> Legal approval chain">
        <div className="space-y-3">
          {rows.slice(0, 12).map((row) => (
            <div key={row.request_id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">Request #{row.request_id}</p>
                <StatusBadge status={row.approval_status} />
              </div>
              <ApprovalStepper steps={["Doctor", "Hospital", "Legal"]} current={row.currentStep} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default ApprovalWorkflowPage;
