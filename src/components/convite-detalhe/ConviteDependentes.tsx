import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Users } from "lucide-react";
import { parentescos } from "./constants";

interface Props {
  dados: Record<string, any>;
  editing: boolean;
  updateField: (key: string, value: any) => void;
}

export function ConviteDependentes({ dados, editing, updateField }: Props) {
  const deps = (dados.dependentes as any[]) || [];

  if (deps.length === 0 && !editing) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Dependentes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Users className="h-10 w-10 mb-3" />
            <p className="text-sm">Nenhum dependente cadastrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dependentes</CardTitle>
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                updateField("dependentes", [
                  ...deps,
                  { nome_completo: "", cpf: "", data_nascimento: "", parentesco: "", incluir_irrf: false, incluir_plano_saude: false },
                ]);
              }}
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {deps.map((dep, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              {editing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Dependente {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => {
                        const newDeps = [...deps];
                        newDeps.splice(i, 1);
                        updateField("dependentes", newDeps);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="md:col-span-2 lg:col-span-3">
                      <Label className="text-xs text-muted-foreground">Nome Completo *</Label>
                      <Input className="h-9" value={dep.nome_completo || ""} onChange={(e) => {
                        const newDeps = [...deps]; newDeps[i] = { ...dep, nome_completo: e.target.value }; updateField("dependentes", newDeps);
                      }} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">CPF</Label>
                      <Input className="h-9" value={dep.cpf || ""} placeholder="000.000.000-00" onChange={(e) => {
                        const newDeps = [...deps]; newDeps[i] = { ...dep, cpf: e.target.value }; updateField("dependentes", newDeps);
                      }} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data de Nascimento *</Label>
                      <Input type="date" className="h-9" value={dep.data_nascimento || ""} onChange={(e) => {
                        const newDeps = [...deps]; newDeps[i] = { ...dep, data_nascimento: e.target.value }; updateField("dependentes", newDeps);
                      }} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Parentesco *</Label>
                      <Select value={dep.parentesco || ""} onValueChange={(v) => {
                        const newDeps = [...deps]; newDeps[i] = { ...dep, parentesco: v }; updateField("dependentes", newDeps);
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {parentescos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-6 md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={dep.incluir_irrf || false} onCheckedChange={(v) => {
                          const newDeps = [...deps]; newDeps[i] = { ...dep, incluir_irrf: !!v }; updateField("dependentes", newDeps);
                        }} />
                        <Label className="text-xs font-normal">Incluir no IRRF</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={dep.incluir_plano_saude || false} onCheckedChange={(v) => {
                          const newDeps = [...deps]; newDeps[i] = { ...dep, incluir_plano_saude: !!v }; updateField("dependentes", newDeps);
                        }} />
                        <Label className="text-xs font-normal">Incluir no Plano de Saúde</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><span className="text-xs text-muted-foreground">Nome</span><p className="text-sm font-medium">{dep.nome_completo || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">CPF</span><p className="text-sm font-medium">{dep.cpf || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Nascimento</span><p className="text-sm font-medium">{dep.data_nascimento || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Parentesco</span><p className="text-sm font-medium">{dep.parentesco || "—"}</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
