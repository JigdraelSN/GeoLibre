// Owner-facing member/guest-link management for one project, backed by
// `backend/geolibre_server_api`'s `/api/projects/{id}/members` and
// `/api/projects/{id}/guest-links`. Opened from the membership-aware gallery
// (ProjectGalleryDialog.tsx) for a project the signed-in account owns.

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@geolibre/ui";
import { AlertCircle, Check, Copy, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shareHostLabel } from "../../lib/share-geolibre";
import {
  addProjectMember,
  createGuestLink,
  fetchProjectMembers,
  removeProjectMember,
  ServerApiError,
  type GuestLink,
  type ProjectMember,
} from "../../lib/server-api-auth";

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

function membersErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ServerApiError) {
    switch (error.code) {
      case "not-found":
        return t("members.errorNotFound");
      case "conflict":
        return t("members.errorConflict");
      case "forbidden":
        return t("members.errorForbidden");
      case "timeout":
        return t("members.errorTimeout");
      case "network":
        return t("members.errorNetwork", { shareHost: shareHostLabel() });
      case "not-configured":
        return t("members.errorNotConfigured");
      default:
        return t("members.errorFallback");
    }
  }
  return error instanceof Error ? error.message : t("members.errorFallback");
}

/** Format an ISO timestamp as a short locale date, or the empty string if unparseable. */
function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
}: ProjectMembersDialogProps) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token) ?? "";

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"member" | "guest">("member");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [guestLabel, setGuestLabel] = useState("");
  const [guestExpiryHours, setGuestExpiryHours] = useState("24");
  const [creatingLink, setCreatingLink] = useState(false);
  const [guestLinkError, setGuestLinkError] = useState<string | null>(null);
  const [guestLink, setGuestLink] = useState<GuestLink | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadMembers = useCallback(async () => {
    if (!token || !projectId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProjectMembers({ projectId, token, signal: controller.signal });
      if (controller.signal.aborted) return;
      setMembers(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to load project members", err);
      setError(membersErrorMessage(err, t));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [projectId, t, token]);

  useEffect(() => {
    if (open) {
      setAddError(null);
      setNewUsername("");
      setNewRole("member");
      setGuestLinkError(null);
      setGuestLink(null);
      setLinkCopied(false);
      setGuestLabel("");
      setGuestExpiryHours("24");
      void loadMembers();
    } else {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open, loadMembers]);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !newUsername.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addProjectMember({ projectId, token, username: newUsername.trim(), role: newRole });
      setNewUsername("");
      await loadMembers();
    } catch (err) {
      console.error("Failed to add project member", err);
      setAddError(membersErrorMessage(err, t));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!token) return;
    setRemovingId(member.id);
    setError(null);
    try {
      await removeProjectMember({ projectId, token, accountId: member.accountId });
      await loadMembers();
    } catch (err) {
      console.error("Failed to remove project member", err);
      setError(membersErrorMessage(err, t));
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateGuestLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const hours = Number(guestExpiryHours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    setCreatingLink(true);
    setGuestLinkError(null);
    setLinkCopied(false);
    try {
      const link = await createGuestLink({
        projectId,
        token,
        label: guestLabel.trim() || undefined,
        expiresInHours: Math.min(Math.round(hours), 24 * 90),
      });
      setGuestLink(link);
      setGuestLabel("");
      await loadMembers();
    } catch (err) {
      console.error("Failed to create guest link", err);
      setGuestLinkError(membersErrorMessage(err, t));
    } finally {
      setCreatingLink(false);
    }
  };

  const copyGuestToken = async () => {
    if (!guestLink) return;
    try {
      await navigator.clipboard.writeText(guestLink.token);
      setLinkCopied(true);
    } catch {
      // Clipboard access can be denied (permissions, non-secure context); the
      // token remains selectable/copyable by hand from the field itself.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg" bodyClassName="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("members.title")}</DialogTitle>
          <DialogDescription>{t("members.description", { project: projectTitle })}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("members.loading")}
          </div>
        ) : members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("members.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("members.columnUser")}</TableHead>
                <TableHead>{t("members.columnRole")}</TableHead>
                <TableHead>{t("members.columnExpires")}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.username ?? (
                      <span className="italic text-muted-foreground">{t("serverAuth.signedInAsGuest")}</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {member.role === "guest" ? t("gallery.roleGuest") : t("gallery.roleMember")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatExpiry(member.expiresAt) ?? t("members.neverExpires")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("members.remove")}
                      title={t("members.remove")}
                      disabled={removingId === member.id}
                      onClick={() => void handleRemoveMember(member)}
                    >
                      {removingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <form className="flex flex-col gap-2 border-t pt-4" onSubmit={(event) => void handleAddMember(event)}>
          <p className="text-sm font-medium">{t("members.addTitle")}</p>
          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              placeholder={t("members.usernamePlaceholder")}
              className="flex-1"
            />
            <Select
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as "member" | "guest")}
              className="w-40 shrink-0"
            >
              <option value="member">{t("members.roleMember")}</option>
              <option value="guest">{t("members.roleGuest")}</option>
            </Select>
            <Button type="submit" disabled={adding || !newUsername.trim()} className="shrink-0">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("members.addAction")}
            </Button>
          </div>
          {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
        </form>

        <form
          className="flex flex-col gap-2 border-t pt-4"
          onSubmit={(event) => void handleCreateGuestLink(event)}
        >
          <p className="text-sm font-medium">{t("members.guestLinkTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("members.guestLinkDescription")}</p>
          <div className="flex gap-2">
            <Input
              value={guestLabel}
              onChange={(event) => setGuestLabel(event.target.value)}
              placeholder={t("members.guestLinkLabelPlaceholder")}
              className="flex-1"
            />
            <div className="flex w-40 shrink-0 flex-col gap-1">
              <Label htmlFor="guest-expiry" className="text-xs text-muted-foreground">
                {t("members.guestLinkExpiryLabel")}
              </Label>
              <Input
                id="guest-expiry"
                type="number"
                min={1}
                max={24 * 90}
                value={guestExpiryHours}
                onChange={(event) => setGuestExpiryHours(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={creatingLink} className="shrink-0 self-end">
              {creatingLink ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("members.guestLinkCreate")
              )}
            </Button>
          </div>
          {guestLinkError ? <p className="text-sm text-destructive">{guestLinkError}</p> : null}
          {guestLink ? (
            <div className="flex flex-col gap-1 rounded-md border bg-muted/50 p-2">
              <Label className="text-xs text-muted-foreground">{t("members.guestLinkTokenLabel")}</Label>
              <div className="flex gap-2">
                <Input readOnly value={guestLink.token} className="flex-1 font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void copyGuestToken()}
                  aria-label={t("members.guestLinkCopy")}
                  title={t("members.guestLinkCopy")}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
