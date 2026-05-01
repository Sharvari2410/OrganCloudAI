import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import { organSections } from "../data/moduleConfigs";

function OrganManagementPage() {
  return <ModuleCrudWorkbench sections={organSections} />;
}

export default OrganManagementPage;
