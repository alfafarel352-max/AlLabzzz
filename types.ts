export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: number;
  extension: string;
}

export type FileExtension = 
  | '.rbxm' 
  | '.rbxmx' 
  | '.rbxl' 
  | '.rbxlx' 
  | '.rbxs' 
  | '.rbxst' 
  | '.rbxasset';

export const ALLOWED_EXTENSIONS: string[] = [
  '.rbxm', '.rbxmx', '.rbxl', '.rbxlx', '.rbxs', '.rbxst', '.rbxasset'
];

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;