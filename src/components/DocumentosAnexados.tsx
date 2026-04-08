import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Eye, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StorageFile {
  name: string;
  url: string;
  isImage: boolean;
}

const LABEL_MAP: Record<string, string> = {
  rg_cnh_frente: "RG ou CNH (Frente)",
  rg_cnh_verso: "RG ou CNH (Verso)",
  contrato_social: "Contrato Social",
  cartao_cnpj: "Cartão CNPJ",
};

function friendlyName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return LABEL_MAP[base] || base.replace(/_/g, " ");
}

function isImageFile(name: string): boolean {
  return /\.(jpe?g|png|webp|gif|bmp)$/i.test(name);
}

interface DocumentosAnexadosProps {
  colaboradorId?: string;
  contratoPjId?: string;
}

export function DocumentosAnexados({ colaboradorId, contratoPjId }: DocumentosAnexadosProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        // Find the convite linked to this colaborador/contrato to get the token
        let query = supabase.from("convites_cadastro").select("token");
        if (colaboradorId) {
          query = query.eq("colaborador_id", colaboradorId);
        } else if (contratoPjId) {
          query = query.eq("contrato_pj_id", contratoPjId);
        } else {
          setLoading(false);
          return;
        }

        const { data: convites } = await query;
        
        if (!convites || convites.length === 0) {
          // Also try finding by checking dados_preenchidos for uploaded files
          // Try listing files directly if we have the ID
          setLoading(false);
          return;
        }

        const allFiles: StorageFile[] = [];

        for (const convite of convites) {
          const { data: storageFiles } = await supabase.storage
            .from("documentos-cadastro")
            .list(convite.token, { limit: 50 });

          if (storageFiles) {
            for (const sf of storageFiles) {
              if (sf.name === ".emptyFolderPlaceholder") continue;
              const { data: urlData } = supabase.storage
                .from("documentos-cadastro")
                .getPublicUrl(`${convite.token}/${sf.name}`);

              allFiles.push({
                name: sf.name,
                url: urlData.publicUrl,
                isImage: isImageFile(sf.name),
              });
            }
          }
        }

        setFiles(allFiles);
      } catch (err) {
        console.error("Erro ao carregar documentos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [colaboradorId, contratoPjId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando documentos anexados...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum documento anexado encontrado.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.name} className="border-muted">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {file.isImage ? (
                  <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                )}
                <span className="text-sm font-medium">{friendlyName(file.name)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setPreviewTitle(friendlyName(file.name));
                    setPreviewUrl(file.url);
                  }}
                  title="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                  title="Download"
                >
                  <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
            {previewUrl && (
              previewUrl.match(/\.pdf$/i) ? (
                <iframe src={previewUrl} className="w-full h-[65vh] border rounded" />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewTitle}
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}