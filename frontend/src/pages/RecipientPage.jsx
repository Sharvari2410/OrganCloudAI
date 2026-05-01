import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import { recipientSections } from "../data/moduleConfigs";

function RecipientPage() {
  return <ModuleCrudWorkbench sections={recipientSections} />;
}

export default RecipientPage;
