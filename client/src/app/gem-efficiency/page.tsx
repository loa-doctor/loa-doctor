import GemEfficiencyManager from "@/src/features/gem-efficiency/components/GemEfficiencyManager";
import { ThemeProvider } from "@/src/features/smart-crafting/contexts/ThemeContext";

export default function GemEfficiency() {
  return (
    <ThemeProvider>
      <main>
        <GemEfficiencyManager />
      </main>
    </ThemeProvider>
  );
}
