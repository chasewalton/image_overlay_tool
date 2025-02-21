import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { ImageControlsComponent } from '../image-controls/image-controls.component';
import { KeyboardShortcutsComponent } from '../keyboard-shortcuts/keyboard-shortcuts.component';
import { KeyboardControlsService } from '../../services/keyboard-controls.service';
import { CanvasRendererService } from '../../services/canvas-renderer.service';
import { ImageLayer } from '../../models/image-layer.model';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-image-overlay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageUploadComponent,
    ImageControlsComponent,
    KeyboardShortcutsComponent
  ],
  templateUrl: './image-overlay.component.html',
  styleUrls: ['./image-overlay.component.scss']
})
export class ImageOverlayComponent implements AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: false }) containerRef!: ElementRef<HTMLDivElement>;
  
  containerWidth = window.innerWidth;
  containerHeight = window.innerHeight - 200;
  controlsHeight = 200;
  minControlsHeight = 150;
  maxControlsHeight = 500;

  scrollSpeed = 50; // Pixels per scroll event

  backgroundImage: ImageLayer | null = null;
  overlayImage: ImageLayer | null = null;
  
  private isDragging = false;
  private dragStart: Point | null = null;
  private initialPosition: Point | null = null;

  isDividerDragging = false;
  private initialControlsHeight = 0;
  private initialDragY = 0;

  maintainBackgroundAspectRatio = true;
  maintainOverlayAspectRatio = true;

  constructor(
    private keyboardControls: KeyboardControlsService,
    private canvasRenderer: CanvasRendererService
  ) {
    // Add window event listeners for divider dragging
    window.addEventListener('mousemove', this.onDividerDrag.bind(this));
    window.addEventListener('mouseup', this.stopDividerDrag.bind(this));
  }

  ngAfterViewInit() {
    this.containerRef.nativeElement.focus();
  }

  onBackgroundImageSelected(file: File) {
    this.createImageLayer(file).then(layer => {
      this.backgroundImage = layer;
      this.updateCanvas();
    });
  }

  onOverlayImageSelected(file: File) {
    this.createImageLayer(file).then(layer => {
      this.overlayImage = layer;
      this.updateCanvas();
    });
  }

  private createImageLayer(file: File): Promise<ImageLayer> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        // Calculate initial dimensions to fit the container while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // If image is larger than container, scale it down
        if (width > this.containerWidth || height > this.containerHeight) {
          const scaleX = this.containerWidth / width;
          const scaleY = this.containerHeight / height;
          const scale = Math.min(scaleX, scaleY);
          
          width *= scale;
          height *= scale;
        }

        const layer: ImageLayer = {
          file,
          url,
          opacity: 1,
          x: 0,
          y: 0,
          width,
          height,
          originalWidth: img.width,
          originalHeight: img.height,
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          contrast: 1,
          visible: true,
          inverted: false
        };
        resolve(layer);
      };
      
      img.src = url;
    });
  }

  onMouseWheel(event: WheelEvent) {
    if (!this.overlayImage) return;

    const container = event.currentTarget as HTMLElement;
    
    // Prevent default scrolling behavior
    event.preventDefault();

    const delta = Math.sign(event.deltaY) * -this.scrollSpeed;
    const scale = 1 + delta / 1000;

    if (this.maintainOverlayAspectRatio) {
      this.overlayImage.width *= scale;
      this.overlayImage.height *= scale;
    } else {
      // Scale width or height based on scroll direction
      if (event.shiftKey) {
        this.overlayImage.height *= scale;
      } else {
        this.overlayImage.width *= scale;
      }
    }

    this.updateCanvas();
  }

  @HostListener('window:resize')
  onResize() {
    this.containerWidth = window.innerWidth;
    this.containerHeight = window.innerHeight - this.controlsHeight;
    this.updateCanvas();
  }

  updateCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.backgroundImage) return;

    // Update canvas size to match container
    const containerRect = this.containerRef.nativeElement.getBoundingClientRect();
    this.containerWidth = containerRect.width;
    this.containerHeight = containerRect.height - this.controlsHeight;

    this.canvasRenderer.renderCanvas(ctx, canvas, this.backgroundImage, this.overlayImage);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.overlayImage) return;

    // Handle left shift key separately
    if (event.key === 'Shift' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const handled = this.keyboardControls.handleKeyPress('', this.overlayImage, this.maintainOverlayAspectRatio, true);
      if (handled) {
        event.preventDefault();
        this.updateCanvas();
      }
      return;
    }

    const handled = this.keyboardControls.handleKeyPress(
      event.key, 
      this.overlayImage,
      this.maintainOverlayAspectRatio
    );

    if (handled) {
      event.preventDefault();
      this.updateCanvas();
    }
  }

  onMouseDown(event: MouseEvent) {
    if (!this.overlayImage) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on overlay
    const clickedOnOverlay = this.canvasRenderer.isClickOnOverlay(x, y, this.overlayImage);
    if (clickedOnOverlay) {
      this.isDragging = true;
      this.dragStart = { x, y };
      this.initialPosition = {
        x: this.overlayImage.x,
        y: this.overlayImage.y
      };
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.dragStart || !this.initialPosition || !this.overlayImage) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const deltaX = currentX - this.dragStart.x;
    const deltaY = currentY - this.dragStart.y;

    this.overlayImage.x = this.initialPosition.x + deltaX;
    this.overlayImage.y = this.initialPosition.y + deltaY;

    this.updateCanvas();
  }

  onMouseUp() {
    this.isDragging = false;
    this.dragStart = null;
    this.initialPosition = null;
  }

  startDividerDrag(event: MouseEvent) {
    this.isDividerDragging = true;
    this.initialControlsHeight = this.controlsHeight;
    this.initialDragY = event.clientY;
    event.preventDefault();
  }

  private onDividerDrag = (event: MouseEvent) => {
    if (!this.isDividerDragging) return;

    const deltaY = this.initialDragY - event.clientY;
    let newHeight = this.initialControlsHeight + deltaY;

    // Constrain the height within min and max bounds
    newHeight = Math.max(this.minControlsHeight, Math.min(this.maxControlsHeight, newHeight));
    
    this.controlsHeight = newHeight;
    this.containerHeight = window.innerHeight - newHeight;
    this.updateCanvas();
  }

  private stopDividerDrag = () => {
    this.isDividerDragging = false;
  }

  toggleFlip(direction: 'horizontal' | 'vertical') {
    if (!this.overlayImage) return;
    
    if (direction === 'horizontal') {
      this.overlayImage.flipHorizontal = !this.overlayImage.flipHorizontal;
    } else {
      this.overlayImage.flipVertical = !this.overlayImage.flipVertical;
    }
    
    this.updateCanvas();
  }

  resetRotation() {
    if (this.overlayImage) {
      this.overlayImage.rotation = 0;
      this.updateCanvas();
    }
  }

  resetBackgroundSize() {
    if (this.backgroundImage) {
      this.backgroundImage.width = this.backgroundImage.originalWidth;
      this.backgroundImage.height = this.backgroundImage.originalHeight;
      this.updateCanvas();
    }
  }

  resetOverlaySize() {
    if (this.overlayImage) {
      this.overlayImage.width = this.overlayImage.originalWidth;
      this.overlayImage.height = this.overlayImage.originalHeight;
      this.updateCanvas();
    }
  }
}
