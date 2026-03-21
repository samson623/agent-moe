-- Add telegram to connector_platform enum and create connector record for existing links

ALTER TYPE connector_platform ADD VALUE IF NOT EXISTS 'telegram';
