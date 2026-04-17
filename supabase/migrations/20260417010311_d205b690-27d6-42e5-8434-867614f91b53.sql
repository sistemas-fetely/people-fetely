CREATE OR REPLACE FUNCTION public.autosave_convite_cadastro(_token text, _dados jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE convites_cadastro
  SET dados_preenchidos = _dados
  WHERE token = _token
    AND status IN ('pendente', 'email_enviado', 'preenchido', 'devolvido');
  RETURN FOUND;
END;
$function$;