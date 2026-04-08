
-- Function to fetch convite by token (public, no auth needed)
CREATE OR REPLACE FUNCTION public.get_convite_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT to_jsonb(c.*) INTO result
  FROM convites_cadastro c
  WHERE c.token = _token
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Function to submit filled data (public, no auth needed)
CREATE OR REPLACE FUNCTION public.submit_convite_cadastro(
  _token text,
  _dados jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _convite record;
BEGIN
  SELECT * INTO _convite
  FROM convites_cadastro
  WHERE token = _token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite não encontrado';
  END IF;
  
  IF _convite.status != 'pendente' THEN
    RAISE EXCEPTION 'Este convite já foi utilizado ou cancelado';
  END IF;
  
  IF _convite.expira_em < now() THEN
    RAISE EXCEPTION 'Este convite expirou';
  END IF;
  
  UPDATE convites_cadastro
  SET dados_preenchidos = _dados,
      status = 'preenchido',
      preenchido_em = now()
  WHERE token = _token;
  
  -- Create notification for HR
  INSERT INTO notificacoes_rh (tipo, titulo, mensagem, link, user_id)
  VALUES (
    'cadastro_preenchido',
    _convite.nome || ' preencheu o cadastro',
    'O ' || CASE WHEN _convite.tipo = 'clt' THEN 'colaborador CLT' ELSE 'prestador PJ' END || ' ' || _convite.nome || ' completou o formulário de pré-cadastro.',
    '/convites-cadastro',
    _convite.criado_por
  );
  
  RETURN true;
END;
$$;

-- Add SELECT policy for authenticated HR users
CREATE POLICY "HR can read convites"
ON public.convites_cadastro
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'gestor_rh'::app_role)
);
