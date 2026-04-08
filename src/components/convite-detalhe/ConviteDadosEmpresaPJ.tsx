import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  dados: Record<string, any>;
  editing: boolean;
  updateField: (key: string, value: any) => void;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function ConviteDadosEmpresaPJ({ dados, editing, updateField }: Props) {
  const Field = ({ label, value }: { label: string; value: any }) => (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

  if (!editing) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Dados do Responsável / Prestador</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3"><Field label="Nome Completo" value={dados.contato_nome} /></div>
              <Field label="Telefone" value={dados.contato_telefone} />
              <div className="md:col-span-2"><Field label="Email" value={dados.contato_email} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Dados da Empresa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="CNPJ" value={dados.cnpj} />
              <div className="md:col-span-2"><Field label="Razão Social" value={dados.razao_social} /></div>
              <Field label="Nome Fantasia" value={dados.nome_fantasia} />
              <Field label="Inscrição Municipal" value={dados.inscricao_municipal} />
              <Field label="Inscrição Estadual" value={dados.inscricao_estadual} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Dados da Empresa</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Dados do Responsável / Prestador</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Nome Completo *</Label>
              <Input className="h-9" value={dados.contato_nome || ""} onChange={(e) => updateField("contato_nome", e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input className="h-9" value={dados.contato_telefone || ""} onChange={(e) => updateField("contato_telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input className="h-9" type="email" value={dados.contato_email || ""} onChange={(e) => updateField("contato_email", e.target.value)} placeholder="email@empresa.com" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Dados da Empresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">CNPJ *</Label>
              <Input className="h-9" value={dados.cnpj || ""} onChange={(e) => updateField("cnpj", formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Razão Social *</Label>
              <Input className="h-9" value={dados.razao_social || ""} onChange={(e) => updateField("razao_social", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
              <Input className="h-9" value={dados.nome_fantasia || ""} onChange={(e) => updateField("nome_fantasia", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Inscrição Municipal</Label>
              <Input className="h-9" value={dados.inscricao_municipal || ""} onChange={(e) => updateField("inscricao_municipal", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Inscrição Estadual</Label>
              <Input className="h-9" value={dados.inscricao_estadual || ""} onChange={(e) => updateField("inscricao_estadual", e.target.value)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
