import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EnsinarDialogProps {
  mensagem: { id: string; conteudo: string };
  perguntaOriginal: string;
  onClose: () => void;
  onEnviado: () => void;
}

const CATEGORIAS = [
  { value: "politica", label: "Política" },
  { value: "regra", label: "Regra" },
  { value: "diretriz", label: "Diretriz" },
  { value: "faq", label: "FAQ" },
  { value: "conceito", label: "Conceito" },
  { value: "manifesto", label: "Manifesto" },
  { value: "mercado", label: "Mercado" },
];

export function EnsinarDialog({ mensagem, perguntaOriginal, onClose, onEnviado }: EnsinarDialogProps) {
  const { user } = useAuth();
  const [correcao, setCorrecao] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
    if (!user || !correcao.trim()) return;
    setSalvando(true);
    try {
      const insertData: any = {
        user_id: user.id,
        pergunta_original: perguntaOriginal,
        resposta_ia: mensagem.conteudo,
        correcao_sugerida: correcao.trim(),
        categoria_sugerida: categoria || null,
        titulo_sugerido: titulo.trim() || null,
        origem: "ensinar",
        status: "pendente",
      };
      if (!mensagem.id.startsWith("tmp-")) {
        insertData.mensagem_id = mensagem.id;
      }
      const { error } = await supabase
        .from("fala_fetely_sugestoes_conhecimento")
        .insert(insertData);
      if (error) throw error;
      onEnviado();
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎓 Ajude o Fala Fetely a aprender</DialogTitle>
          <DialogDescription>
            Se essa resposta estava incompleta, errada ou desatualizada, você pode ensinar a forma correta. Um admin vai revisar e adicionar à Base de Conhecimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Pergunta do usuário:</p>
            <p className="text-sm">{perguntaOriginal || "(pergunta não disponível)"}</p>
          </div>

          <div className="bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-1">Resposta que a IA deu:</p>
            <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
          </div>

          <div>
            <Label>Como deveria ter sido a resposta correta? *</Label>
            <Textarea
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              placeholder="Escreva aqui a resposta correta, com detalhes relevantes..."
              rows={6}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria sugerida (opcional)</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título sugerido (opcional)</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: 'Celular corporativo — quem tem direito'"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button
            onClick={enviar}
            disabled={!correcao.trim() || salvando}
            style={{ backgroundColor: "#1A4A3A" }}
            className="text-white hover:opacity-90 gap-2"
          >
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar sugestão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
