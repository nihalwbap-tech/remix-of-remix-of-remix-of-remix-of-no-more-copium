import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Eye,
  FileEdit,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Lightbulb,
  Plus,
  Sparkles,
  Trash2,
  X,
  Bold,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BooksShelfIcon } from "@/components/client/BooksShelfIcon";
import { RichContentRenderer } from "@/components/client/RichContentRenderer";
import type { Guide, GuideModule } from "@/lib/guides-types";
import {
  loadGuides,
  saveGuide,
  saveGuides,
  deleteGuide,
  syncGuidesFromCloud,
} from "@/lib/guides-storage";
import { LOCAL_GUIDES_CHANGED_EVENT } from "@/lib/local-events";
import { cn } from "@/lib/utils";

export function CoachGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>(() => loadGuides());

  // Guide Dialog State
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [guideTitle, setGuideTitle] = useState("");
  const [guideDescription, setGuideDescription] = useState("");
  const [guideCoverUrl, setGuideCoverUrl] = useState("");
  const [guidePublished, setGuidePublished] = useState(true);

  // Active Guide for Module Management
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  // Module Editor Dialog State
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<GuideModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleReadTime, setModuleReadTime] = useState("4");
  const [moduleTopImageUrl, setModuleTopImageUrl] = useState("");
  const [moduleContent, setModuleContent] = useState("");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  // Link Insertion Popover State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleGuidesChanged = () => {
      setGuides(loadGuides());
    };
    window.addEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
    void syncGuidesFromCloud().then((cloudGuides) => {
      if (cloudGuides && cloudGuides.length > 0) setGuides(cloudGuides);
    });
    return () => {
      window.removeEventListener(LOCAL_GUIDES_CHANGED_EVENT, handleGuidesChanged);
    };
  }, []);

  const selectedGuide = useMemo(() => {
    return guides.find((g) => g.id === selectedGuideId) ?? null;
  }, [guides, selectedGuideId]);

  // Open Guide Creator / Editor
  const handleOpenGuideDialog = (guide?: Guide) => {
    if (guide) {
      setEditingGuide(guide);
      setGuideTitle(guide.title);
      setGuideDescription(guide.description);
      setGuideCoverUrl(guide.coverImageUrl ?? "");
      setGuidePublished(guide.isPublished);
    } else {
      setEditingGuide(null);
      setGuideTitle("");
      setGuideDescription("");
      setGuideCoverUrl("");
      setGuidePublished(true);
    }
    setGuideDialogOpen(true);
  };

  const handleSaveGuide = () => {
    if (!guideTitle.trim()) return;

    if (editingGuide) {
      const updated: Guide = {
        ...editingGuide,
        title: guideTitle.trim(),
        description: guideDescription.trim(),
        coverImageUrl: guideCoverUrl.trim() || undefined,
        isPublished: guidePublished,
        updatedAt: new Date().toISOString(),
      };
      saveGuide(updated);
    } else {
      const newGuide: Guide = {
        id: `guide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: guideTitle.trim(),
        description: guideDescription.trim(),
        coverImageUrl: guideCoverUrl.trim() || undefined,
        isPublished: guidePublished,
        orderIndex: guides.length,
        modules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveGuide(newGuide);
      setSelectedGuideId(newGuide.id);
    }

    setGuideDialogOpen(false);
  };

  const handleDeleteGuide = (guideId: string) => {
    if (window.confirm("Are you sure you want to delete this guide?")) {
      deleteGuide(guideId);
      if (selectedGuideId === guideId) setSelectedGuideId(null);
    }
  };

  // Open Module Creator / Editor
  const handleOpenModuleDialog = (module?: GuideModule) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleReadTime(String(module.estimatedReadMinutes ?? 4));
      setModuleTopImageUrl(module.topImageUrl ?? "");
      setModuleContent(module.content ?? "");
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleReadTime("4");
      setModuleTopImageUrl("");
      setModuleContent("");
    }
    setPreviewTab("edit");
    setModuleDialogOpen(true);
  };

  const handleSaveModule = () => {
    if (!selectedGuide || !moduleTitle.trim()) return;

    const readMinutes = parseInt(moduleReadTime, 10) || 4;
    let nextModules: GuideModule[];

    if (editingModule) {
      nextModules = selectedGuide.modules.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              title: moduleTitle.trim(),
              estimatedReadMinutes: readMinutes,
              topImageUrl: moduleTopImageUrl.trim() || undefined,
              content: moduleContent,
              updatedAt: new Date().toISOString(),
            }
          : m,
      );
    } else {
      const newModule: GuideModule = {
        id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        guideId: selectedGuide.id,
        title: moduleTitle.trim(),
        orderIndex: selectedGuide.modules.length,
        estimatedReadMinutes: readMinutes,
        topImageUrl: moduleTopImageUrl.trim() || undefined,
        content: moduleContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      nextModules = [...selectedGuide.modules, newModule];
    }

    const updatedGuide: Guide = {
      ...selectedGuide,
      modules: nextModules,
      updatedAt: new Date().toISOString(),
    };

    saveGuide(updatedGuide);
    setModuleDialogOpen(false);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!selectedGuide) return;
    if (window.confirm("Delete this module?")) {
      const nextModules = selectedGuide.modules
        .filter((m) => m.id !== moduleId)
        .map((m, idx) => ({ ...m, orderIndex: idx }));
      saveGuide({ ...selectedGuide, modules: nextModules, updatedAt: new Date().toISOString() });
    }
  };

  // Text Formatting Helper (Inserts text or wraps selected text)
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setModuleContent((prev) => prev + `${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = moduleContent.substring(start, end);
    const textToWrap = selected || placeholder;
    const replacement = `${prefix}${textToWrap}${suffix}`;

    const nextContent =
      moduleContent.substring(0, start) + replacement + moduleContent.substring(end);
    setModuleContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + textToWrap.length,
      );
    }, 50);
  };

  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selected = moduleContent.substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkText(selected || "Link text");
    } else {
      setLinkText("Link text");
    }
    setLinkUrl("https://");
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || "link";
    const formatted = `[${text}](${linkUrl.trim()})`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextContent =
        moduleContent.substring(0, start) + formatted + moduleContent.substring(end);
      setModuleContent(nextContent);
    } else {
      setModuleContent((prev) => prev + formatted);
    }

    setLinkModalOpen(false);
  };

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[1.375rem] font-bold tracking-tight text-foreground">Guides Studio</h1>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Coach Hal
            </span>
          </div>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">
            Create, edit, and publish training guides and hypertrophy courses.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => handleOpenGuideDialog()}
          className="h-10 gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Guide</span>
        </Button>
      </div>

      {/* Main Studio View: Guides & Module Management */}
      <div className="grid grid-cols-1 gap-6">
        {guides.map((guide) => {
          const isSelected = selectedGuideId === guide.id;
          const totalMods = guide.modules?.length ?? 0;

          return (
            <div
              key={guide.id}
              className={cn(
                "rounded-xl border bg-card transition-all overflow-hidden",
                isSelected ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border",
              )}
            >
              {/* Guide Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-border/60 bg-muted/20">
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {guide.coverImageUrl ? (
                      <img
                        src={guide.coverImageUrl}
                        alt={guide.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <BooksShelfIcon className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground line-clamp-1">{guide.title}</h2>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-[0.18em]",
                          guide.isPublished
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700",
                        )}
                      >
                        {guide.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{guide.description}</p>
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {totalMods} {totalMods === 1 ? "Module" : "Modules"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenGuideDialog(guide)}
                    className="h-8 text-xs font-medium"
                  >
                    Edit Info
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "secondary"}
                    onClick={() => setSelectedGuideId(isSelected ? null : guide.id)}
                    className={cn(
                      "h-8 text-xs font-semibold gap-1",
                      isSelected && "bg-primary text-white",
                    )}
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>{isSelected ? "Close Modules" : "Manage Modules"}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGuide(guide.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete Guide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Modules Accordion / Expanded Area */}
              {isSelected && (
                <div className="p-4 sm:p-5 space-y-4 bg-black/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Modules in this Guide ({totalMods})
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenModuleDialog()}
                      className="h-8 gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Module</span>
                    </Button>
                  </div>

                  {guide.modules.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No modules added yet. Tap <strong>Add Module</strong> to create your first lesson.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {guide.modules.map((mod, idx) => (
                        <div
                          key={mod.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-white/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                              {idx + 1}
                            </span>
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                {mod.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{mod.estimatedReadMinutes ?? 4} min read</span>
                                {mod.topImageUrl && <span>• Has top banner</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenModuleDialog(mod)}
                              className="h-8 text-xs font-medium text-foreground hover:text-primary"
                            >
                              Edit Content
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteModule(mod.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide Info Edit Dialog */}
      <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingGuide ? "Edit Guide Details" : "Create New Guide"}</DialogTitle>
            <DialogDescription>
              Set the course title, description, and cover image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="guide-title" className="text-xs font-semibold">Guide Title</Label>
              <Input
                id="guide-title"
                value={guideTitle}
                onChange={(e) => setGuideTitle(e.target.value)}
                placeholder="e.g. The Progressive Overload Bible"
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guide-desc" className="text-xs font-semibold">Description</Label>
              <Textarea
                id="guide-desc"
                value={guideDescription}
                onChange={(e) => setGuideDescription(e.target.value)}
                placeholder="Explain what the client will learn..."
                rows={3}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guide-cover" className="text-xs font-semibold">Cover Image URL (Optional)</Label>
              <Input
                id="guide-cover"
                value={guideCoverUrl}
                onChange={(e) => setGuideCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="bg-background"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Publish to Clients</Label>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, all clients will see this guide in their app.
                </p>
              </div>
              <Switch checked={guidePublished} onCheckedChange={setGuidePublished} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setGuideDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveGuide} className="bg-primary text-white">
              Save Guide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WordPress-Style Module Studio Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>
                {editingModule ? "Edit Module Content" : "Create New Module"}
              </DialogTitle>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab("edit")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                    previewTab === "edit"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1",
                    previewTab === "preview"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Eye className="h-3 w-3" />
                  <span>Live Preview</span>
                </button>
              </div>
            </div>
            <DialogDescription>
              Write lesson content, add dynamic top images, format text, and insert signature Netflix Red links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Module Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Module Title</Label>
                <Input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Reps in Reserve (RIR) & True Failure"
                  className="bg-background font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estimated Read Time</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={moduleReadTime}
                    onChange={(e) => setModuleReadTime(e.target.value)}
                    className="bg-background"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">min</span>
                </div>
              </div>
            </div>

            {/* Dynamic Top Image Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Top Banner Image URL (Optional)</span>
                {moduleTopImageUrl && (
                  <button
                    type="button"
                    onClick={() => setModuleTopImageUrl("")}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </Label>
              <Input
                value={moduleTopImageUrl}
                onChange={(e) => setModuleTopImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-background text-xs"
              />
              {moduleTopImageUrl && (
                <div className="mt-2 h-28 overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={moduleTopImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Editor or Live Preview View */}
            {previewTab === "edit" ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Lesson Content (Markdown & Rich Text)</Label>

                {/* WordPress-Style Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-border bg-muted/40 p-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertFormatting("**", "**", "bold text")}
                    className="h-8 px-2 text-xs font-bold hover:bg-background"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertFormatting("*", "*", "italic text")}
                    className="h-8 px-2 text-xs italic hover:bg-background"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleOpenLinkModal}
                    className="h-8 px-2 text-xs font-semibold text-primary hover:bg-background"
                    title="Insert Netflix Red Hyperlink"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertFormatting("## ", "", "Heading 2")}
                    className="h-8 px-2 text-xs font-bold hover:bg-background"
                    title="Heading 2 (## text)"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertFormatting("### ", "", "Heading 3")}
                    className="h-8 px-2 text-xs font-bold hover:bg-background"
                    title="Heading 3 (### text)"
                  >
                    <Heading3 className="h-3.5 w-3.5" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertFormatting("- ", "", "List item")}
                    className="h-8 px-2 text-xs hover:bg-background"
                    title="Bulleted List (- item)"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      insertFormatting("> **Coach Hal's Rule:** ", "", "Key takeaway here")
                    }
                    className="h-8 px-2 text-xs text-amber-400 hover:bg-background flex items-center gap-1"
                    title="Coach Tip Callout (> text)"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Tip</span>
                  </Button>
                </div>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={moduleContent}
                  onChange={(e) => setModuleContent(e.target.value)}
                  placeholder="Write your guide content here... Use the toolbar above for Bold, Italic, and Netflix Red links."
                  rows={12}
                  className="rounded-t-none border-t-0 font-mono text-sm leading-relaxed bg-background"
                />
              </div>
            ) : (
              /* Live Client Preview */
              <div className="rounded-xl border border-border bg-background p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Client View Preview
                  </span>
                  <span className="text-xs text-muted-foreground">{moduleReadTime} min read</span>
                </div>

                {moduleTopImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={moduleTopImageUrl}
                      alt="Top Banner"
                      className="w-full max-h-[300px] object-cover"
                    />
                  </div>
                )}

                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {moduleTitle || "Untitled Module"}
                </h1>

                <div className="pt-2">
                  <RichContentRenderer content={moduleContent || "*No content written yet.*"} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setModuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveModule} className="bg-primary text-white">
              Save Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Link Popover / Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Insert Hyperlink</DialogTitle>
            <DialogDescription className="text-xs">
              Links render in signature Netflix Red (#E50910) and open in new tabs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Link Display Text</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. Coach Hal's Instagram"
                className="bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Destination URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://instagram.com/andr0lone"
                className="bg-background text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setLinkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyLink}
              className="bg-primary text-white font-semibold"
            >
              Insert Red Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
