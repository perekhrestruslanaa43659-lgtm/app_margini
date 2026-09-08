-- Foto della sala da mostrare nel PDF "menu proposta" (foto hero sotto il titolo,
-- come nel template di riferimento SKILLS-STILE.md). Percorso relativo servito da
-- public/, es. "/rooms/dehors.jpg" -> public/rooms/dehors.jpg.
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
