import { Injectable } from '@angular/core';
import { ImageLayer } from '../models/image-layer.model';
import { HandleType } from './transform-controls.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasRendererService {
  private imageCache = new Map<string, HTMLImageElement>();
  private renderQueued = false;
  private readonly HANDLE_SIZE = 10;
  private readonly EDGE_SIZE = 20;

  async renderCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    backgroundImage: ImageLayer,
    overlayImage: ImageLayer | null,
    activeHandle: HandleType = HandleType.None
  ) {
    if (this.renderQueued) return;
    this.renderQueued = true;

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(async () => {
      // Create offscreen canvas for double buffering
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');
      if (!offscreenCtx) return;

      // Calculate total required canvas size
      const totalBounds = this.calculateTotalBounds(backgroundImage, overlayImage);
      
      // Set both canvases to the same size
      canvas.width = offscreenCanvas.width = totalBounds.width;
      canvas.height = offscreenCanvas.height = totalBounds.height;

      // Clear offscreen canvas
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // Draw background first (not interactive)
      if (backgroundImage) {
        await this.drawImage(offscreenCtx, backgroundImage);
      }

      // Draw overlay on top (interactive)
      if (overlayImage && overlayImage.visible) {
        await this.drawImage(offscreenCtx, overlayImage);
        this.drawTransformHandles(offscreenCtx, overlayImage, activeHandle);
      }

      // Copy the offscreen canvas to the visible canvas in one operation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreenCanvas, 0, 0);

      this.renderQueued = false;
    });
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
      // Use cached image or load and cache it
      let img = this.imageCache.get(image.url);
      if (!img) {
        img = await this.loadImage(image.url);
        this.imageCache.set(image.url, img);
      }

      // Draw the image to the temporary canvas
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
        }
        tempCtx.putImageData(imageData, 0, 0);
      }

      // Draw the processed image to the main canvas
      ctx.drawImage(tempCanvas, 0, 0);
    }

    ctx.restore();
  }

  private drawTransformHandles(ctx: CanvasRenderingContext2D, image: ImageLayer, activeHandle: HandleType) {
    ctx.save();
    
    // Transform context to match image rotation
    ctx.translate(image.x + image.width / 2, image.y + image.height / 2);
    ctx.rotate((image.rotation * Math.PI) / 180);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw corner handles
    const corners = [
      { x: 0, y: 0, type: HandleType.TopLeft },
      { x: image.width, y: 0, type: HandleType.TopRight },
      { x: 0, y: image.height, type: HandleType.BottomLeft },
      { x: image.width, y: image.height, type: HandleType.BottomRight }
    ];

    corners.forEach(corner => {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, this.HANDLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = corner.type === activeHandle ? '#2196F3' : '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

    // Draw edge handles
    const edges = [
      { x: image.width / 2, y: 0, type: HandleType.Top },
      { x: image.width, y: image.height / 2, type: HandleType.Right },
      { x: image.width / 2, y: image.height, type: HandleType.Bottom },
      { x: 0, y: image.height / 2, type: HandleType.Left }
    ];

    edges.forEach(edge => {
      ctx.beginPath();
      ctx.rect(
        edge.x - this.EDGE_SIZE / 2,
        edge.y - this.EDGE_SIZE / 2,
        this.EDGE_SIZE,
        this.EDGE_SIZE
      );
      ctx.fillStyle = edge.type === activeHandle ? '#2196F3' : 'rgba(255, 255, 255, 0.5)';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

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
