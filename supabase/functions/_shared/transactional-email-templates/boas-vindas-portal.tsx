import * as React from 'npm:react@18.3.1'
/// <reference types="npm:@types/react@18.3.1" />
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Fetely People"

interface BoasVindasProps {
  nome?: string
  email?: string
  senha?: string
  link?: string
}

const BoasVindasPortalEmail = ({ nome, email, senha, link }: BoasVindasProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso ao portal {SITE_NAME} está pronto!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao {SITE_NAME}!</Heading>
        <Text style={text}>
          Olá{nome ? `, ${nome}` : ''}! Seu acesso ao portal foi criado com sucesso.
        </Text>
        <Text style={text}>Use as credenciais abaixo para fazer seu primeiro login:</Text>
        <Container style={credBox}>
          <Text style={credLabel}>E-mail:</Text>
          <Text style={credValue}>{email || '—'}</Text>
          <Text style={credLabel}>Senha temporária:</Text>
          <Text style={credValue}>{senha || '—'}</Text>
        </Container>
        <Text style={warningText}>
          ⚠️ Por segurança, troque sua senha no primeiro acesso.
        </Text>
        {link && (
          <Button style={button} href={link}>
            Acessar o Portal
          </Button>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          Este é um e-mail automático enviado por {SITE_NAME}. Caso não reconheça esta mensagem, ignore-a.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BoasVindasPortalEmail,
  subject: `Seu acesso ao ${SITE_NAME} está pronto!`,
  displayName: 'Boas-vindas ao portal',
  previewData: {
    nome: 'Maria Silva',
    email: 'maria@exemplo.com',
    senha: 'Abc@12345',
    link: 'https://people-fetely.lovable.app',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto', padding: '30px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a3a5c', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 16px' }
const credBox = { backgroundColor: '#f4f6f8', borderRadius: '8px', padding: '16px 20px', margin: '0 0 16px' }
const credLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 2px', textTransform: 'uppercase' as const }
const credValue = { fontSize: '15px', color: '#1a3a5c', fontWeight: 'bold' as const, margin: '0 0 12px' }
const warningText = { fontSize: '14px', color: '#b45309', backgroundColor: '#fef3c7', padding: '10px 14px', borderRadius: '6px', margin: '0 0 20px' }
const button = { backgroundColor: '#1a3a5c', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' as const, margin: '0 0 24px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
