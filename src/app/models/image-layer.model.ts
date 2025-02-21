export interface ImageLayer {
  file: File;
  url: string;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  contrast: number;
  visible: boolean;
  inverted: boolean; // New property for color inversion
}
