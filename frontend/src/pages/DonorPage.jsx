import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import { donorSections } from "../data/moduleConfigs";

function DonorPage() {
  return <ModuleCrudWorkbench sections={donorSections} />;
}

export default DonorPage;
