import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bancos } from "./constants";

interface Props {
  dados: Record<string, any>;
  editing: boolean;
  updateField: (key: string, value: any) => void;
}

export function ConviteDadosBancarios({ dados, editing, updateField }: Props) {
  const handleBancoChange = (codigo: string) => {
    const banco = bancos.find(b => b.codigo === codigo);
    updateField("banco_codigo", codigo);
    updateField("banco_nome", banco?.nome || "");
  };

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

  if (!editing) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Dados Bancários</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Banco" value={dados.banco_nome ? `${dados.banco_codigo} - ${dados.banco_nome}` : undefined} />
            <Field label="Agência" value={dados.agencia} />
            <Field label="Conta" value={dados.conta} />
            <Field label="Tipo de Conta" value={dados.tipo_conta === "poupanca" ? "Poupança" : dados.tipo_conta === "salario" ? "Salário" : dados.tipo_conta === "corrente" ? "Corrente" : dados.tipo_conta} />
            <Field label="Chave PIX" value={dados.chave_pix} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Dados Bancários</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Banco</Label>
            <Select value={dados.banco_codigo || ""} onValueChange={handleBancoChange}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
              <SelectContent>
                {bancos.map(b => (
                  <SelectItem key={b.codigo} value={b.codigo}>{b.codigo} - {b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Agência</Label>
            <Input className="h-9" value={dados.agencia || ""} onChange={(e) => updateField("agencia", e.target.value)} placeholder="0000" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Conta</Label>
            <Input className="h-9" value={dados.conta || ""} onChange={(e) => updateField("conta", e.target.value)} placeholder="00000-0" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tipo de Conta</Label>
            <Select value={dados.tipo_conta || "corrente"} onValueChange={(v) => updateField("tipo_conta", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Conta Poupança</SelectItem>
                <SelectItem value="salario">Conta Salário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Chave PIX</Label>
            <Input className="h-9" value={dados.chave_pix || ""} onChange={(e) => updateField("chave_pix", e.target.value)} placeholder="CPF, email, telefone ou chave aleatória" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
