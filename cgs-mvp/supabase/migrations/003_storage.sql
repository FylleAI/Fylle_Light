-- =============================================================
-- Fylle MVP — Storage Buckets
-- =============================================================
-- Migration 003: Supabase Storage buckets + RLS policies
-- =============================================================

-- Bucket privato per output generati (immagini, audio, video)
INSERT INTO storage.buckets (id, name, public) VALUES ('outputs', 'outputs', false);

-- Bucket pubblico per anteprime (thumbnail)
INSERT INTO storage.buckets (id, name, public) VALUES ('previews', 'previews', true);

-- =============================================================
-- STORAGE POLICIES
-- =============================================================

-- Outputs: ogni utente può caricare/vedere/eliminare solo i propri file
-- I file sono organizzati per user_id: outputs/{user_id}/{filename}
CREATE POLICY "user_upload_outputs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'outputs'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "user_view_outputs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'outputs'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "user_delete_outputs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'outputs'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Previews: pubbliche in lettura, upload solo per il proprio utente
CREATE POLICY "public_previews" ON storage.objects
    FOR SELECT USING (bucket_id = 'previews');

CREATE POLICY "user_upload_previews" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'previews'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
