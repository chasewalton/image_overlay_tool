import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { ImageControlsComponent } from '../image-controls/image-controls.component';
import { KeyboardShortcutsComponent } from '../keyboard-shortcuts/keyboard-shortcuts.component';
import { KeyboardControlsService } from '../../services/keyboard-controls.service';
import { CanvasRendererService } from '../../services/canvas-renderer.service';
import { TransformControlsService, HandleType } from '../../services/transform-controls.service';
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
  private activeHandle: HandleType = HandleType.None;
  
  isDividerDragging = false;
  private initialControlsHeight = 0;
  private initialDragY = 0;

  maintainBackgroundAspectRatio = true;
  maintainOverlayAspectRatio = true;

  lastMouseX: number = 0;
  lastMouseY: number = 0;

  constructor(
    private keyboardControls: KeyboardControlsService,
    private canvasRenderer: CanvasRendererService,
    private transformControls: TransformControlsService
  ) {
    // Add window event listeners for divider dragging
    window.addEventListener('mousemove', this.onDividerDrag.bind(this));
    window.addEventListener('mouseup', this.stopDividerDrag.bind(this));
  }

  ngAfterViewInit() {
    this.containerRef.nativeElement.focus();
  }

  onBackgroundImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.createImageLayer(input.files[0], true);
    }
  }

  onOverlayImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.createImageLayer(input.files[0], false);
    }
  }

  private createImageLayer(file: File, isBackground: boolean): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        const layer: ImageLayer = {
          file,
          url,
          width: img.width,
          height: img.height,
          originalWidth: img.width,
          originalHeight: img.height,
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          visible: true,
          flipHorizontal: false,
          flipVertical: false,
          contrast: 1,
          inverted: false
        };

        if (isBackground) {
          this.backgroundImage = layer;
        } else {
          this.overlayImage = layer;
        }
        
        this.updateCanvas();
        resolve();
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

  onMouseDown(event: MouseEvent) {
    if (!this.overlayImage) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Store initial mouse position
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.lastMouseX = x;
    this.lastMouseY = y;
    
    // Convert to canvas coordinates for hit testing
    const canvasX = x * (canvas.width / rect.width);
    const canvasY = y * (canvas.height / rect.height);
    
    this.activeHandle = this.transformControls.getHandleAtPoint(canvasX, canvasY, this.overlayImage);
    
    if (this.activeHandle !== HandleType.None) {
      this.isDragging = true;
      this.dragStart = { x: canvasX, y: canvasY };
      this.initialPosition = {
        x: this.overlayImage.x,
        y: this.overlayImage.y
      };
      return;
    }

    if (this.canvasRenderer.isClickOnOverlay(canvasX, canvasY, this.overlayImage)) {
      this.isDragging = true;
      this.dragStart = { x: canvasX, y: canvasY };
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
    
    // Get current mouse position
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    // Calculate the change from last position
    const moveX = currentX - this.lastMouseX;
    const moveY = currentY - this.lastMouseY;

    // Update last position
    this.lastMouseX = currentX;
    this.lastMouseY = currentY;

    if (this.activeHandle !== HandleType.None) {
      this.transformControls.updateTransform(
        this.activeHandle,
        moveX,
        moveY,
        this.overlayImage,
        event.shiftKey || this.maintainOverlayAspectRatio
      );
    } else {
      // Regular dragging - still relative to start position for smooth dragging
      const startX = (this.dragStart.x / canvas.width) * rect.width;
      const startY = (this.dragStart.y / canvas.height) * rect.height;
      const deltaX = (currentX - startX) * (canvas.width / rect.width);
      const deltaY = (currentY - startY) * (canvas.height / rect.height);

      this.overlayImage.x = this.initialPosition.x + deltaX;
      this.overlayImage.y = this.initialPosition.y + deltaY;
    }

    this.updateCanvas();
  }

  onMouseUp() {
    this.isDragging = false;
    this.dragStart = null;
    this.initialPosition = null;
    this.activeHandle = HandleType.None;
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

    this.canvasRenderer.renderCanvas(
      ctx,
      canvas,
      this.backgroundImage,
      this.overlayImage,
      this.activeHandle
    );
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
