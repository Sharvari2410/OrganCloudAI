import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import ApprovalStepper from "../components/ApprovalStepper";
import SectionCard from "../components/SectionCard";
import { surgerySections } from "../data/moduleConfigs";

function SurgeryPage() {
  return (
    <div className="space-y-6">
      <SectionCard title="Approval Workflow" subtitle="Standardized pre-surgery governance flow">
        <ApprovalStepper
          steps={[
            "Compatibility Verified",
            "Medical Board",
            "Legal Clearance",
            "OT Scheduling",
            "Surgery Complete",
          ]}
          current={3}
        />
      </SectionCard>

      <ModuleCrudWorkbench sections={surgerySections} />
    </div>
  );
}

export default SurgeryPage;
