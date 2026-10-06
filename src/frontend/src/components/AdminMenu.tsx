import { AccessKeyForm } from "@/components/AccessKeyForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, MoreVertical } from "lucide-react";
import { useState } from "react";

export function AdminMenu() {
  const { t } = useLanguage();
  const { session, role } = useSession();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openAdmin = () => {
    if (session && role === "admin") {
      void navigate({ to: "/admin" });
      return;
    }
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    void navigate({ to: "/admin" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("nav.more")}
            data-ocid="nav.more_button"
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={openAdmin}
            className="gap-2"
            data-ocid="nav.admin_access_item"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {t("nav.adminAccess")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="admin_access.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" aria-hidden="true" />
              {t("adminAccess.title")}
            </DialogTitle>
            <DialogDescription>{t("adminAccess.subtitle")}</DialogDescription>
          </DialogHeader>
          <AccessKeyForm
            kind="admin"
            labelKey="adminAccess.keyLabel"
            placeholderKey="adminAccess.keyPlaceholder"
            submitKey="adminAccess.submit"
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
