import { Injectable } from '@angular/core';
import { ImageLayer } from '../models/image-layer.model';

@Injectable({
  providedIn: 'root'
})
export class KeyboardControlsService {
  private readonly MOVE_STEP = 10;
  private readonly ROTATION_STEP = 5;
  private readonly OPACITY_STEP = 0.1;
  private readonly CONTRAST_STEP = 0.1;
  private readonly SIZE_STEP = 0.1;

  handleKeyPress(key: string, overlayImage: ImageLayer, maintainAspectRatio: boolean, isShiftKey: boolean = false): boolean {
    // Handle Shift key separately
    if (isShiftKey) {
      overlayImage.visible = !overlayImage.visible;
      return true;
    }

    switch(key.toLowerCase()) {
      case 'w':
        overlayImage.y -= this.MOVE_STEP;
        break;
      case 's':
        overlayImage.y += this.MOVE_STEP;
        break;
      case 'a':
        overlayImage.x -= this.MOVE_STEP;
        break;
      case 'd':
        overlayImage.x += this.MOVE_STEP;
        break;
      case 'q':
        overlayImage.rotation = (overlayImage.rotation - this.ROTATION_STEP + 360) % 360;
        break;
      case 'e':
        overlayImage.rotation = (overlayImage.rotation + this.ROTATION_STEP) % 360;
        break;
      case 'z':
        overlayImage.opacity = Math.max(0, overlayImage.opacity - this.OPACITY_STEP);
        break;
      case 'x':
        overlayImage.opacity = Math.min(1, overlayImage.opacity + this.OPACITY_STEP);
        break;
      case 'c':
        overlayImage.contrast = Math.max(0, overlayImage.contrast - this.CONTRAST_STEP);
        break;
      case 'v':
        overlayImage.contrast = Math.min(2, overlayImage.contrast + this.CONTRAST_STEP);
        break;
      case 'f':
        this.resizeOverlay(overlayImage, 1 - this.SIZE_STEP, maintainAspectRatio);
        break;
      case 'g':
        this.resizeOverlay(overlayImage, 1 + this.SIZE_STEP, maintainAspectRatio);
        break;
      default:
        return false;
    }
    return true;
  }

  private resizeOverlay(overlayImage: ImageLayer, scale: number, maintainAspectRatio: boolean) {
    const newWidth = overlayImage.width * scale;
    const newHeight = maintainAspectRatio
      ? newWidth * (overlayImage.originalHeight / overlayImage.originalWidth)
      : overlayImage.height * scale;

    // Don't allow the image to become too small
    if (newWidth < 10 || newHeight < 10) return;

    // Update dimensions
    overlayImage.width = newWidth;
    overlayImage.height = newHeight;

    // Adjust position to maintain center point
    const deltaWidth = overlayImage.width * (1 - scale) / 2;
    const deltaHeight = overlayImage.height * (1 - scale) / 2;
    overlayImage.x += deltaWidth;
    overlayImage.y += deltaHeight;
  }
}
