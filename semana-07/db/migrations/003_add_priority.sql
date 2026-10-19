-- Evolucionar el esquema: añadir otro archivo, no modificar el ya aplicado.
-- DEFAULT asigna un valor también a las filas que ya existían.
ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'high'));
