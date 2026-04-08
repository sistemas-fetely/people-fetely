DROP POLICY IF EXISTS "Public can update pendente convite" ON public.convites_cadastro;

CREATE POLICY "Public can update pendente or email_enviado convite"
ON public.convites_cadastro
FOR UPDATE
TO public
USING ((status IN ('pendente', 'email_enviado', 'preenchido')) AND (expira_em > now() OR status IN ('preenchido', 'email_enviado')))
WITH CHECK ((status IN ('pendente', 'email_enviado', 'preenchido')) AND (expira_em > now() OR status IN ('preenchido', 'email_enviado')));