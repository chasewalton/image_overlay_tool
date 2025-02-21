import { Injectable } from '@angular/core';
import { ImageLayer } from '../models/image-layer.model';

@Injectable({
  providedIn: 'root'
})
export class CanvasRendererService {
  async renderCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    backgroundImage: ImageLayer,
    overlayImage: ImageLayer | null
  ) {
    // Calculate total required canvas size
    const totalBounds = this.calculateTotalBounds(backgroundImage, overlayImage);
    
    // Set canvas size
    canvas.width = totalBounds.width;
    canvas.height = totalBounds.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background first (not interactive)
    if (backgroundImage) {
      await this.drawImage(ctx, backgroundImage);
    }

    // Draw overlay on top (interactive)
    if (overlayImage && overlayImage.visible) {
      await this.drawImage(ctx, overlayImage);
    }
  }

  private async drawImage(ctx: CanvasRenderingContext2D, image: ImageLayer) {
    ctx.save();

    // Apply transformations
    ctx.translate(image.x + image.width / 2, image.y + image.height / 2);
    ctx.rotate((image.rotation * Math.PI) / 180);
    ctx.scale(
      image.flipHorizontal ? -1 : 1,
      image.flipVertical ? -1 : 1
    );
    ctx.translate(-image.width / 2, -image.height / 2);

    // Set global alpha for opacity
    ctx.globalAlpha = image.opacity;

    // Create a temporary canvas for applying filters
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Draw the image to the temporary canvas
      const img = await this.loadImage(image.url);
      tempCtx.drawImage(img, 0, 0, image.width, image.height);

      // Apply contrast
      if (image.contrast !== 1) {
        tempCtx.filter = `contrast(${image.contrast})`;
        const tempCanvas2 = document.createElement('canvas');
        tempCanvas2.width = image.width;
        tempCanvas2.height = image.height;
        const tempCtx2 = tempCanvas2.getContext('2d');
        if (tempCtx2) {
          tempCtx2.drawImage(tempCanvas, 0, 0);
          tempCtx.clearRect(0, 0, image.width, image.height);
          tempCtx.filter = 'none';
          tempCtx.drawImage(tempCanvas2, 0, 0);
        }
      }

      // Apply color inversion if enabled
      if (image.inverted) {
        const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];         // Red
          data[i + 1] = 255 - data[i + 1]; // Green
          data[i + 2] = 255 - data[i + 2]; // Blue
          // Alpha channel remains unchanged
        }
        tempCtx.putImageData(imageData, 0, 0);
      }

      // Draw the processed image to the main canvas
      ctx.drawImage(tempCanvas, 0, 0);
    }

    ctx.restore();
  }

  private calculateTotalBounds(backgroundImage: ImageLayer, overlayImage: ImageLayer | null) {
    let minX = backgroundImage.x;
    let minY = backgroundImage.y;
    let maxX = backgroundImage.x + backgroundImage.width;
    let maxY = backgroundImage.y + backgroundImage.height;

    if (overlayImage && overlayImage.visible) {
      minX = Math.min(minX, overlayImage.x);
      minY = Math.min(minY, overlayImage.y);
      maxX = Math.max(maxX, overlayImage.x + overlayImage.width);
      maxY = Math.max(maxY, overlayImage.y + overlayImage.height);
    }

    // Add padding to prevent image from being cut off when rotated
    const padding = 50;
    return {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    };
  }

  isClickOnOverlay(x: number, y: number, overlay: ImageLayer): boolean {
    // Convert click coordinates to image space
    const centerX = overlay.x + overlay.width / 2;
    const centerY = overlay.y + overlay.height / 2;
    
    // Translate point to origin
    const dx = x - centerX;
    const dy = y - centerY;
    
    // Rotate point
    const angle = (-overlay.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // Translate back
    const finalX = rotatedX + centerX;
    const finalY = rotatedY + centerY;
    
    // Check if point is within image bounds
    return (
      finalX >= overlay.x &&
      finalX <= overlay.x + overlay.width &&
      finalY >= overlay.y &&
      finalY <= overlay.y + overlay.height
    );
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = url;
    });
  }
}
