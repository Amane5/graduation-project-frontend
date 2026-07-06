import { useEffect, useState } from "react";
import { Edit2, FileText, Trash2, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChildren, type Child } from "@/lib/children";
import { useAuth } from "@/contexts/AuthContext";
import { deleteFile, getFiles, updateFile, uploadFile } from "@/lib/file";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import DeleteChildModal from "@/components/dashboard/DeleteChildModal";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ChildFile = {
  id: number;
  title: string;
  createdAt: string;
  children: Array<{
    child: {
      id: string | number;
      firstName?: string;
    };
  }>;
};

export default function MyFiles() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [childPickerValue, setChildPickerValue] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [files, setFiles] = useState<ChildFile[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<ChildFile | null>(null);
  const [editChildren, setEditChildren] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadChildren = async () => {
      try {
        const childrenList = await getChildren();
        setChildren(childrenList.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    void loadChildren();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const loadFiles = async () => {
      try {
        const data = await getFiles();
        setFiles(data.data.documents || []);
      } catch (error) {
        console.log(error);
      }
    };

    void loadFiles();
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (selectedChildren.length === 0) {
      setShowAlert(true);
      return;
    }

    try {
      await uploadFile(selectedFile, selectedChildren.map(Number));
      const data = await getFiles();
      setFiles(data.data.documents || []);
      setSelectedFile(null);
      setSelectedChildren([]);
      setChildPickerValue("");
      setShowAlert(false);
    } catch (error) {
      console.log(error);
      setShowAlert(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await deleteFile(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      toast.success(t("fileDeletedSuccess"));
    } catch (error) {
      console.log(error);
      toast.error(t("fileDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (file: ChildFile) => {
    setEditingFile(file);
    setEditChildren(file.children.map((item) => String(item.child.id)));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      await updateFile(editingFile.id, editChildren.map(Number));
      const data = await getFiles();
      setFiles(data.data.documents || []);
      setEditOpen(false);
      setEditingFile(null);
      setEditChildren([]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectChild = (value: string) => {
    if (!selectedChildren.includes(value)) {
      setSelectedChildren((prev) => [...prev, value]);
    }

    setChildPickerValue("");
    setShowAlert(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-bold">{t("myFiles")}</h1>

        {showAlert ? (
          <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <AlertTriangleIcon />
            <AlertTitle>{t("warning")}</AlertTitle>
            <AlertDescription>{t("myFilesSelectAtLeastOneChild")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-10 rounded-2xl border bg-card p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold">{t("uploadNewFile")}</h2>

          <div className="mb-6">
            <label htmlFor="fileUpload" className="mb-2 block font-semibold">
              {t("chooseFile")}
            </label>

            <input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          {selectedFile ? (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-muted p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span>{selectedFile.name}</span>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700"
                aria-label={t("delete")}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          <div className="mb-6">
            <label htmlFor="children" className="mb-2 block font-semibold">
              {t("selectChildren")}
            </label>

            <Select value={childPickerValue} onValueChange={handleSelectChild}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={t("chooseChild")} />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={String(child.id)}>
                      {child.firstName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedChildren.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedChildren.map((childId) => {
                const child = children.find((item) => String(item.id) === childId);

                return (
                  <div
                    key={childId}
                    className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                  >
                    {child?.firstName}
                  </div>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleUpload}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            <Upload className="h-5 w-5" />
            {t("uploadFile")}
          </button>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold">{t("uploadedFiles")}</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {files.map((file) => (
              <div key={file.id} className="rounded-2xl border bg-card p-5 shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6" />

                    <div>
                      <h3 className="font-bold">{file.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditDialog(file)} aria-label={t("edit")}>
                      <Edit2 />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === file.id}
                      onClick={() => setDeletingId(file.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {file.children.map((item) => (
                    <span
                      key={item.child.id}
                      className="rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {item.child.firstName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editChildrenTitle")}</DialogTitle>
            </DialogHeader>

            <p>{editingFile?.title}</p>

            {children.map((child) => (
              <label key={child.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editChildren.includes(String(child.id))}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setEditChildren((prev) => [...prev, String(child.id)]);
                      return;
                    }

                    setEditChildren((prev) =>
                      prev.filter((id) => id !== String(child.id)),
                    );
                  }}
                />
                {child.firstName}
              </label>
            ))}

            <button type="button" onClick={handleSaveEdit}>
              {t("save")}
            </button>
          </DialogContent>
        </Dialog>
      </div>

      <DeleteChildModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title={t("deleteFileTitle")}
        description={t("deleteFileDescription")}
        onConfirm={() => (deletingId ? handleDelete(deletingId) : undefined)}
      />
    </div>
  );
}
