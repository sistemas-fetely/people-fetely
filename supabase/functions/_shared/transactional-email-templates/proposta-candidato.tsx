/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  nome?: string
  cargo?: string
  tipo_contrato?: string
  salario?: string | null
  data_inicio?: string | null
  beneficios?: string | null
  observacoes?: string | null
}

export function PropostaCandidato({
  nome = 'Candidato',
  cargo = 'a vaga',
  tipo_contrato = 'CLT',
  salario = null,
  data_inicio = null,
  beneficios = null,
  observacoes = null,
}: Props) {
  const primeiroNome = nome.split(' ')[0]
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Proposta de trabalho — {cargo} na Fetely</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '30px 25px' }}>

          {/* Header */}
          <Section style={{ marginBottom: '24px' }}>
            <Text style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a3a5c', margin: '0 0 4px' }}>
              Fetély.
            </Text>
            <Text style={{ fontSize: '12px', color: '#999999', margin: 0 }}>
              Vamos celebrar!! Venha criar algo novo...
            </Text>
          </Section>

          {/* Conteúdo */}
          <Section>
            <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a3a5c', margin: '0 0 16px' }}>
              Proposta de trabalho
            </Text>
            <Text style={{ fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 12px' }}>
              {primeiroNome}, temos uma proposta para você! 🎉
            </Text>
            <Text style={{ fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 20px' }}>
              Ficamos muito impressionados com seu processo e gostaríamos de convidar você
              a fazer parte do time Fetely como <strong>{cargo}</strong>.
            </Text>

            {/* Card da proposta */}
            <Section style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a3a5c', margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                Detalhes da proposta
              </Text>

              {/* Cargo */}
              <Section style={{ marginBottom: '12px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>Cargo</Text>
                <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1a3a5c', margin: 0 }}>{cargo}</Text>
              </Section>

              {/* Tipo */}
              <Section style={{ marginBottom: '12px' }}>
                <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>Tipo de contrato</Text>
                <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1a3a5c', margin: 0 }}>{tipo_contrato}</Text>
              </Section>

              {/* Salário */}
              {salario && (
                <Section style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>
                    {tipo_contrato === 'PJ' ? 'Honorários' : 'Salário'}
                  </Text>
                  <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1a3a5c', margin: 0 }}>{salario}/mês</Text>
                </Section>
              )}

              {/* Data início */}
              {data_inicio && (
                <Section style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>Início previsto</Text>
                  <Text style={{ fontSize: '15px', fontWeight: '600', color: '#1a3a5c', margin: 0 }}>{data_inicio}</Text>
                </Section>
              )}

              {/* Benefícios */}
              {beneficios && (
                <Section style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>Benefícios</Text>
                  <Text style={{ fontSize: '14px', color: '#3a3a4a', margin: 0 }}>{beneficios}</Text>
                </Section>
              )}

              {/* Observações */}
              {observacoes && (
                <Section style={{ marginBottom: '0' }}>
                  <Text style={{ fontSize: '12px', color: '#999', margin: '0 0 2px' }}>Informações adicionais</Text>
                  <Text style={{ fontSize: '14px', color: '#3a3a4a', margin: 0 }}>{observacoes}</Text>
                </Section>
              )}
            </Section>

            <Text style={{ fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 12px' }}>
              Para aceitar ou tirar dúvidas sobre esta proposta, basta responder este e-mail
              ou entrar em contato com nosso time de RH.
            </Text>

            <Text style={{ fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 12px' }}>
              Estamos animados com a possibilidade de ter você no time. ✨
            </Text>
          </Section>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

          <Section>
            <Text style={{ fontSize: '12px', color: '#999999', margin: 0 }}>
              Fetely · Vamos celebrar!! Venha criar algo novo...
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PropostaCandidato,
  subject: (data: Record<string, any>) =>
    `Proposta de trabalho — ${data.cargo ?? 'a vaga'} na Fetely`,
  previewData: {
    nome: 'Maria Silva',
    cargo: 'Analista RH Jr',
    tipo_contrato: 'CLT',
    salario: 'R$ 3.200',
    data_inicio: '01/05/2026',
    beneficios: 'VR, VT, Plano de Saúde',
    observacoes: null,
  },
}
