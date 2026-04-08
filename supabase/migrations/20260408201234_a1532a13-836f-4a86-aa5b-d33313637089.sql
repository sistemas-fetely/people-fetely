
-- Create storage bucket for pre-registration document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-cadastro',
  'documentos-cadastro',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Allow anyone to upload documents (public pre-registration form)
CREATE POLICY "Anyone can upload cadastro documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'documentos-cadastro');

-- Allow anyone to read cadastro documents
CREATE POLICY "Anyone can read cadastro documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documentos-cadastro');
