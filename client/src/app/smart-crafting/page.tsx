import SmartCraftingManager from "@/src/features/smart-crafting/components/SmartCraftingManager";
import { ThemeProvider } from "@/src/features/smart-crafting/contexts/ThemeContext";

export default function Home() {
  return (
    <ThemeProvider>
      <main>
        <SmartCraftingManager />
      </main>
    </ThemeProvider>
  );
}
