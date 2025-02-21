import { Injectable } from '@angular/core';
import { ImageLayer } from '../models/image-layer.model';

export enum HandleType {
  None = 'none',
  TopLeft = 'topLeft',
  Top = 'top',
  TopRight = 'topRight',
  Right = 'right',
  BottomRight = 'bottomRight',
  Bottom = 'bottom',
  BottomLeft = 'bottomLeft',
  Left = 'left'
}

@Injectable({
  providedIn: 'root'
})
export class TransformControlsService {
  private readonly HANDLE_SIZE = 10;
  private readonly EDGE_THRESHOLD = 20;

  getHandleAtPoint(x: number, y: number, image: ImageLayer): HandleType {
    // Convert point to image space
    const centerX = image.x + image.width / 2;
    const centerY = image.y + image.height / 2;
    
    // Translate point to origin
    const dx = x - centerX;
    const dy = y - centerY;
    
    // Rotate point
    const angle = (-image.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // Translate back
    const finalX = rotatedX + centerX;
    const finalY = rotatedY + centerY;

    // Check corners first (they take precedence)
    if (this.isNearPoint(finalX, finalY, image.x, image.y)) return HandleType.TopLeft;
    if (this.isNearPoint(finalX, finalY, image.x + image.width, image.y)) return HandleType.TopRight;
    if (this.isNearPoint(finalX, finalY, image.x, image.y + image.height)) return HandleType.BottomLeft;
    if (this.isNearPoint(finalX, finalY, image.x + image.width, image.y + image.height)) return HandleType.BottomRight;

    // Then check edges
    if (this.isNearEdge(finalX, finalY, image.x + image.width / 2, image.y, true)) return HandleType.Top;
    if (this.isNearEdge(finalX, finalY, image.x + image.width, image.y + image.height / 2, false)) return HandleType.Right;
    if (this.isNearEdge(finalX, finalY, image.x + image.width / 2, image.y + image.height, true)) return HandleType.Bottom;
    if (this.isNearEdge(finalX, finalY, image.x, image.y + image.height / 2, false)) return HandleType.Left;

    return HandleType.None;
  }

  private isNearPoint(x: number, y: number, pointX: number, pointY: number): boolean {
    const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
    return distance <= this.HANDLE_SIZE;
  }

  private isNearEdge(x: number, y: number, edgeX: number, edgeY: number, isHorizontal: boolean): boolean {
    if (isHorizontal) {
      return Math.abs(y - edgeY) <= this.EDGE_THRESHOLD && Math.abs(x - edgeX) <= this.EDGE_THRESHOLD;
    } else {
      return Math.abs(x - edgeX) <= this.EDGE_THRESHOLD && Math.abs(y - edgeY) <= this.EDGE_THRESHOLD;
    }
  }

  updateTransform(
    handle: HandleType,
    moveX: number,
    moveY: number,
    image: ImageLayer,
    maintainAspectRatio: boolean
  ): void {
    // Handle rotation
    if ([HandleType.Top, HandleType.Right, HandleType.Bottom, HandleType.Left].includes(handle)) {
      const centerX = image.x + image.width / 2;
      const centerY = image.y + image.height / 2;
      let angle = (Math.atan2(moveY, moveX) * 180) / Math.PI;
      
      switch (handle) {
        case HandleType.Top: angle += 90; break;
        case HandleType.Right: break;
        case HandleType.Bottom: angle -= 90; break;
        case HandleType.Left: angle += 180; break;
      }
      
      image.rotation = (angle + 360) % 360;
      if (maintainAspectRatio) {
        image.rotation = Math.round(image.rotation / 15) * 15;
      }
      return;
    }

    // Handle resizing - now using actual mouse movement
    const aspectRatio = image.originalWidth / image.originalHeight;

    switch (handle) {
      case HandleType.TopLeft:
        if (maintainAspectRatio) {
          const change = Math.max(Math.abs(moveX), Math.abs(moveY)) * Math.sign(moveX);
          image.width -= change;
          image.height = image.width / aspectRatio;
          image.x += change;
          image.y = image.y + (change / aspectRatio);
        } else {
          image.width -= moveX;
          image.height -= moveY;
          image.x += moveX;
          image.y += moveY;
        }
        break;

      case HandleType.TopRight:
        if (maintainAspectRatio) {
          const change = Math.max(Math.abs(moveX), Math.abs(moveY)) * Math.sign(moveX);
          image.width += change;
          image.height = image.width / aspectRatio;
          image.y -= change / aspectRatio;
        } else {
          image.width += moveX;
          image.height -= moveY;
          image.y += moveY;
        }
        break;

      case HandleType.BottomLeft:
        if (maintainAspectRatio) {
          const change = Math.max(Math.abs(moveX), Math.abs(moveY)) * Math.sign(moveX);
          image.width -= change;
          image.height = image.width / aspectRatio;
          image.x += change;
        } else {
          image.width -= moveX;
          image.height += moveY;
          image.x += moveX;
        }
        break;

      case HandleType.BottomRight:
        if (maintainAspectRatio) {
          const change = Math.max(Math.abs(moveX), Math.abs(moveY)) * Math.sign(moveX);
          image.width += change;
          image.height = image.width / aspectRatio;
        } else {
          image.width += moveX;
          image.height += moveY;
        }
        break;
    }

    // Prevent tiny sizes while maintaining aspect ratio
    if (image.width < 20) {
      image.width = 20;
      if (maintainAspectRatio) {
        image.height = image.width / aspectRatio;
      }
    }
    if (image.height < 20) {
      image.height = 20;
      if (maintainAspectRatio) {
        image.width = image.height * aspectRatio;
      }
    }
  }
}
