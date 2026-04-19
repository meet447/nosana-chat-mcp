import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  ImportIcon,
  ListCollapseIcon,
  Settings2,
  Trash,
} from "lucide-react";

import { useRef } from "react";
import SettingPopover from "./SettingPopover";
import { useChatStore } from "@/store/chat.store";
import { useSettingsStore } from "@/store/setting.store";
import { cn } from "@/lib/utils";

export function LoginDropDown({
  barOpen,
  router,
}: {
  barOpen?: boolean;
  router: any;
}) {
  const { settingsOpen, openSettings, closeSettings } = useSettingsStore();
  const { exportAllThreads, importThreads, clearAll } = useChatStore();

  function handleExport() {
    exportAllThreads().catch(console.error);
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async () => {
    const file = fileInputRef.current?.files?.[0];
    console.log("File selected:", file);
    if (!file) return;

    try {
      await importThreads(file);
      console.log("importThreads finished successfully");
    } catch (err) {
      console.error("importThreads failed:", err);
      alert("Failed to import threads.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="bg-muted rounded border border-border/60 hover:bg-muted-foreground/5 cursor-pointer"
          asChild
        >
          <Button
            variant="outline"
            className={cn(" w-full p-0  flex", barOpen && "justify-between")}
          >
            {barOpen ? (
              <>
                <p className="font-medium text-foreground/85">Nosana Chat</p>
                <ListCollapseIcon className="text-foreground/70" />
              </>
            ) : (
              <Settings2 className="text-foreground/70" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 bg-muted border border-border/60 text-foreground"
          align="center"
        >
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => openSettings()}
              className="flex items-center justify-between"
            >
              Settings
              <DropdownMenuShortcut>
                <Settings2 />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport}>
            ExportAllThreads
            <DropdownMenuShortcut>
              <Download />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            ImportThreads
            <DropdownMenuShortcut>
              <ImportIcon />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              router.push("/ask");
              clearAll();
            }}
          >
            Clear All thread
            <DropdownMenuShortcut>
              <Trash />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <SettingPopover open={settingsOpen} setOpen={closeSettings} />
    </>
  );
}
