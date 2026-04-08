import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  dados: Record<string, any>;
  editing: boolean;
  updateField: (key: string, value: any) => void;
}

export function ConviteDadosEmpresaCLT({ dados, editing, updateField }: Props) {
  const renderField = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input
          type={type}
          value={dados[key] || ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <p className="text-sm font-medium">{dados[key] || "—"}</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Informações da Empresa</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderField("Email Corporativo", "email_corporativo", "email", "colaborador@empresa.com.br")}
          {renderField("Ramal", "ramal", "text", "Ex: 2045")}
          {renderField("Data de Integração", "data_integracao", "date")}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Acessos a sistemas e equipamentos podem ser configurados após a criação do cadastro.
        </p>
      </CardContent>
    </Card>
  );
}
