import { useEffect, useState } from "react";
import { Trash2, Upload, FileText, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getChildren } from "@/lib/children";
import { useAuth } from "@/contexts/AuthContext";
import { deleteFile, getFiles, updateFile, uploadFile } from "@/lib/file";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DeleteChildModal from "@/components/dashboard/DeleteChildModal";
import { AlertTriangleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function MyFiles() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  const [selectedChild, setSelectedChild] = useState<number | null>(null)

  const [children, setChildren] = useState([])

  const [files, setFiles] = useState<any[]>([]);

  const {user}= useAuth()
  
  const [editOpen, setEditOpen] = useState(false);

  const [editingFile, setEditingFile] = useState<any>(null);

  const [editChildren, setEditChildren] = useState<string[]>([]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
      if (!user?.id) return;
  
      const load = async () => {
        try {
          const childrenList = await getChildren();
          setChildren(childrenList.data || []);
          console.log("CHILDREN:", childrenList.data);
          if (childrenList.data?.length > 0) {
            setSelectedChild(childrenList.data[0].id);
          }
        } catch (e) {
          console.log(e);
        }
      };
  
      load();
    }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const loadFiles = async () =>{
      try{
        const data = await getFiles()
        console.log("uploadedd files", data)
        setFiles(data.data.documents || [])
      }catch(err){
        console.log(err)
      }
    }
    loadFiles()
  },[user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async() => {
    if(!selectedFile) return
    if (selectedChildren.length === 0) {
      setShowAlert(true)
      return;
    }
    try{
      await uploadFile(selectedFile, selectedChildren.map(Number))
      const data = await getFiles()
      setFiles(data.data.documents || [])
      setSelectedFile(null)
      setSelectedChildren([])
    }catch(err){
      console.log(err)
      setShowAlert(false);
    }

  };

  const handleDelete = async(id: number) => {
    try{
      setDeletingId(id);
      await deleteFile(id)
      setFiles(files.filter((f) => f.id !== id));
      toast.success("File deleted successfully");
    }catch(err){
      console.log(err)
      toast.error("Failed to delete File");
    }finally{
      setDeletingId(null);
    }
  };

  const openEditDialog = (file:any) => {
  setEditingFile(file);

  setEditChildren(
    file.children.map(
      (c:any) => String(c.child.id)
    )
  );

  setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return
    try{
      // if (editChildren.length === 0) {
      //   alert("Select at least one child");
      //   return;
      // }
      await updateFile(editingFile.id, editChildren.map(Number))
      const data = await getFiles()
      setFiles(data.data.documents)
      setEditOpen(false)
      setEditingFile(null);
      setEditChildren([]);
    }catch(err){
      console.log(err)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">

        {/* TITLE */}
        <h1 className="text-4xl font-bold mb-8">{t("myFiles")}</h1>
        {showAlert && (
        <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <AlertTriangleIcon />
          <AlertTitle>Warning.</AlertTitle>
          <AlertDescription>
            Please select at least one child
          </AlertDescription>
        </Alert>
      )}
        {/* UPLOAD CARD */}
        <div className="bg-card rounded-2xl shadow-md p-6 mb-10 border">
          <h2 className="text-2xl font-bold mb-6">{t("uploadNewFile")}</h2>

          {/* FILE INPUT */}
          <div className="mb-6">
            <label htmlFor="fileUpload" className="block mb-2 font-semibold">
              {t("chooseFile")}
            </label>

            <input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              className="w-full border rounded-xl p-3"
            />
          </div>

          {/* FILE PREVIEW */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-muted rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />

                <span>{selectedFile.name}</span>
              </div>

              <button
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>

            </div>
          )}

          {/* CHILD SELECT */}
          <div className="mb-6">
            <label htmlFor="children" className="block mb-2 font-semibold">
              {t("selectChildren")}
            </label>

            <Select
              value={selectedChild ? String(selectedChild) : ""}
              onValueChange={(value) => {
                setSelectedChild(Number(value));

                if (!selectedChildren.includes(value)) {
                  setSelectedChildren([...selectedChildren, value]);
                }
              }}            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Choose a child" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

          </div>

          {/* SELECTED CHILDREN */}
          {selectedChildren.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">

              {selectedChildren.map((childId) => {
                const child = children.find(
                  (c: any) => String(c.id) === childId
                );

                return (
                  <div
                    key={childId}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    {child?.firstName}
                  </div>
                );
              })}

            </div>
          )}

          {/* UPLOAD BUTTON */}
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:opacity-90"
          >
            <Upload className="w-5 h-5" />

            {t("uploadFile")}
          </button>
        </div>

        {/* FILES LIST */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{t("uploadedFiles")}</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-card rounded-2xl shadow-md p-5 border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />

                    <div>

                      <h3 className="font-bold">

                        {file.title}

                      </h3>

                      <p className="text-sm text-muted-foreground">

                        {new Date(file.createdAt).toLocaleDateString()}

                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                  <button
                  onClick={() => openEditDialog(file)}
                  >
                    <Edit2/>
                  </button>

                  <button
                    disabled={deletingId === file.id}
                    onClick={() => setDeletingId(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  </div>
                  
                </div>

                {/* CHILDREN */}
                <div className="flex flex-wrap gap-2">

                  {file.children.map((item: any) => (

                    <span
                      key={item.child.id}
                      className="bg-secondary px-3 py-1 rounded-full text-sm"
                    >

                      {item.child.firstName}

                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Dialog
          open={editOpen}
          onOpenChange={setEditOpen}
          >
          <DialogContent>

            <DialogHeader>
              <DialogTitle>
                Edit Children
              </DialogTitle>
            </DialogHeader>

            <p>{editingFile?.title}</p>

            {children.map((child:any) => (
              <label
                key={child.id}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={editChildren.includes(
                    String(child.id)
                  )}
                  onChange={(e) => {

                    if (e.target.checked) {
                      setEditChildren([
                        ...editChildren,
                        String(child.id),
                      ]);
                    } else {
                      setEditChildren(
                        editChildren.filter(
                          id => id !== String(child.id)
                        )
                      );
                    }
                  }}
                />

                {child.firstName}
              </label>
            ))}

            <button
              onClick={handleSaveEdit}
            >
              Save
            </button>

          </DialogContent>
        </Dialog>
      </div>
      <DeleteChildModal
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Delete File"
        description="Are you sure you want to delete this file?"
        onConfirm={() => deletingId && handleDelete(deletingId)}
      />
    </div>
  );
}
