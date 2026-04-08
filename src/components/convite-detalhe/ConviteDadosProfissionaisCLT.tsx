import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useParametros } from "@/hooks/useParametros";

interface Props {
  dados: Record<string, any>;
  editing: boolean;
  updateField: (key: string, value: any) => void;
}

export function ConviteDadosProfissionaisCLT({ dados, editing, updateField }: Props) {
  const { data: departamentos, isLoading: loadingDepts } = useParametros("departamento");
  const { data: cargos, isLoading: loadingCargos } = useParametros("cargo");
  const { data: tiposContrato, isLoading: loadingTipos } = useParametros("tipo_contrato");
  const { data: jornadas, isLoading: loadingJornadas } = useParametros("jornada");
  const { data: locaisTrabalho, isLoading: loadingLocais } = useParametros("local_trabalho");

  const renderField = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input
          type={type}
          value={dados[key] || ""}
          onChange={(e) => updateField(key, type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <p className="text-sm font-medium">{dados[key] || "—"}</p>
      )}
    </div>
  );

  const renderSelect = (label: string, key: string, options: { value: string; label: string }[], loading: boolean) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        loading ? (
          <div className="flex items-center h-10"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : (
          <Select value={dados[key] || ""} onValueChange={(v) => updateField(key, v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <p className="text-sm font-medium">{dados[key] || "—"}</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Dados Profissionais</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderField("Matrícula", "matricula", "text", "Gerada automaticamente se vazio")}
          {renderSelect(
            "Cargo *",
            "cargo",
            (cargos || []).map((c) => ({ value: c.label, label: c.label })),
            loadingCargos
          )}
          {renderSelect(
            "Departamento *",
            "departamento",
            (departamentos || []).map((d) => ({ value: d.label, label: d.label })),
            loadingDepts
          )}
          {renderField("Data de Admissão *", "data_admissao", "date")}
          {renderField("Data de Desligamento", "data_desligamento", "date")}
          {renderSelect(
            "Tipo de Contrato",
            "tipo_contrato",
            (tiposContrato || []).map((t) => ({ value: t.valor, label: t.label })),
            loadingTipos
          )}
          {renderField("Salário Base (R$) *", "salario_base", "number", "0,00")}
          {renderSelect(
            "Jornada Semanal",
            "jornada_semanal",
            (jornadas || []).map((j) => ({ value: j.valor, label: j.label })),
            loadingJornadas
          )}
          {renderField("Horário de Trabalho", "horario_trabalho", "text", "08:00 - 17:00")}
          {renderSelect(
            "Local de Trabalho",
            "local_trabalho",
            (locaisTrabalho || []).map((l) => ({ value: l.label, label: l.label })),
            loadingLocais
          )}
        </div>
      </CardContent>
    </Card>
  );
}
