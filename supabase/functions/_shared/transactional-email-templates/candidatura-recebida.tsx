import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview,
  Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  nome?: string
  cargo?: string
  area?: string
  tipo?: string
}

const CandidaturaRecebidaEmail = ({
  nome = 'Candidato',
  cargo = 'a vaga',
  area = '',
  tipo = '',
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Candidatura recebida — {cargo} na Fetely</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={logo}>Fetély.</Heading>
          <Text style={tagline}>Vamos celebrar!! Venha criar algo novo...</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Candidatura recebida! 🎉</Heading>
          <Text style={text}>Olá, <strong>{nome.split(' ')[0]}</strong>!</Text>
          <Text style={text}>
            Recebemos sua candidatura para a vaga de{' '}
            <strong>{cargo}</strong>.
            Estamos muito felizes com seu interesse em fazer parte da Fetely!
          </Text>

          <Section style={vagaCard}>
            <Text style={vagaLabel}>Vaga</Text>
            <Text style={vagaTitulo}>{cargo}</Text>
            <Text style={vagaMeta}>
              {area}{area && tipo ? ' · ' : ''}{tipo?.toUpperCase()}
            </Text>
          </Section>

          <Text style={text}>
            Nossa equipe vai analisar seu perfil com cuidado.
            Se houver avanço no processo, entraremos em contato em breve.
          </Text>
          <Text style={text}>
            Enquanto isso, que tal nos seguir no Instagram?
            Compartilhamos bastante do nosso jeito de celebrar o dia a dia. ✨
          </Text>

          <Button style={btn} href="https://instagram.com/fetely.oficial">
            Seguir @fetely.oficial →
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={footer}>
          <Text style={footerText}>
            Você recebeu este e-mail porque se candidatou a uma vaga na Fetely.
            Seus dados serão tratados conforme nossa política LGPD e retidos
            por até 180 dias após o encerramento da vaga.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CandidaturaRecebidaEmail,
  subject: (data: Record<string, any>) =>
    `Candidatura recebida — ${data.cargo ?? 'a vaga'} na Fetely`,
  displayName: 'Candidatura recebida',
  previewData: {
    nome: 'Maria Silva',
    cargo: 'Analista RH Jr',
    area: 'Administrativo',
    tipo: 'CLT',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1A4A3A', padding: '32px 40px', textAlign: 'center' as const }
const logo = { color: '#ffffff', fontSize: '28px', fontWeight: '700' as const, margin: '0', letterSpacing: '-0.5px' }
const tagline = { color: '#D8F3DC', fontSize: '13px', margin: '8px 0 0', fontStyle: 'italic' }
const content = { padding: '40px' }
const h1 = { color: '#1A4A3A', fontSize: '22px', fontWeight: '700' as const, margin: '0 0 16px' }
const text = { color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }
const vagaCard = { backgroundColor: '#F0FFF4', border: '1px solid #D8F3DC', borderRadius: '12px', padding: '20px', margin: '0 0 28px' }
const vagaLabel = { color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 6px' }
const vagaTitulo = { color: '#1A4A3A', fontSize: '18px', fontWeight: '700' as const, margin: '0 0 4px' }
const vagaMeta = { color: '#6B7280', fontSize: '13px', margin: '0' }
const btn = { display: 'inline-block', backgroundColor: '#1A4A3A', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600' as const, fontSize: '14px' }
const hr = { borderColor: '#E5E7EB', margin: '0' }
const footer = { backgroundColor: '#F9FAFB', padding: '24px 40px' }
const footerText = { color: '#9CA3AF', fontSize: '11px', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
