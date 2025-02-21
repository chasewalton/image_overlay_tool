import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageLayer } from '../../models/image-layer.model';

@Component({
  selector: 'app-image-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-group">
      <h3>{{ title }} Controls</h3>
      <div>
        <label>
          <input type="checkbox"
                 [(ngModel)]="maintainAspectRatio"
                 (ngModelChange)="aspectRatioChange.emit($event)">
          Maintain Aspect Ratio
        </label>
      </div>
      <div>
        <label>Width:</label>
        <input type="number"
               [ngModel]="image?.width"
               (ngModelChange)="updateSize('width', $event)">
      </div>
      <div>
        <label>Height:</label>
        <input type="number"
               [ngModel]="image?.height"
               (ngModelChange)="updateSize('height', $event)">
      </div>
      <div>
        <label>
          <input type="checkbox"
                 [ngModel]="image?.inverted"
                 (ngModelChange)="updateInverted($event)">
          Invert Colors
        </label>
      </div>
      <button (click)="resetSize.emit()">Reset Size</button>
      
      <!-- Overlay-specific controls -->
      <ng-container *ngIf="isOverlay && image">
        <div>
          <label>Opacity:</label>
          <input type="range"
                 min="0"
                 max="1"
                 step="0.1"
                 [ngModel]="image.opacity"
                 (ngModelChange)="updateOpacity($event)">
        </div>
        <div>
          <label>Contrast:</label>
          <input type="range"
                 min="0"
                 max="2"
                 step="0.1"
                 [ngModel]="image.contrast"
                 (ngModelChange)="updateContrast($event)">
        </div>
        <div>
          <label>Rotation:</label>
          <input type="number"
                 [ngModel]="image.rotation"
                 (ngModelChange)="updateRotation($event)">
          <button (click)="resetRotation.emit()">Reset</button>
        </div>
        <div class="button-group">
          <button (click)="flipHorizontal.emit()">Flip Horizontal</button>
          <button (click)="flipVertical.emit()">Flip Vertical</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .control-group {
      padding: 1rem;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 250px;
    }

    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: #333;
    }

    div {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      label {
        min-width: 80px;
        margin-right: 0.5rem;
      }

      input[type="number"],
      input[type="range"] {
        flex: 1;
        min-width: 60px;
        padding: 0.25rem;
      }

      input[type="checkbox"] {
        margin: 0;
      }
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 0.25rem 0;
      flex: 1;

      &:hover {
        background: #0056b3;
      }
    }
  `]
})
export class ImageControlsComponent {
  @Input() title = '';
  @Input() image: ImageLayer | null = null;
  @Input() isOverlay = false;
  @Input() maintainAspectRatio = true;

  @Output() imageChange = new EventEmitter<ImageLayer>();
  @Output() aspectRatioChange = new EventEmitter<boolean>();
  @Output() resetSize = new EventEmitter<void>();
  @Output() resetRotation = new EventEmitter<void>();
  @Output() flipHorizontal = new EventEmitter<void>();
  @Output() flipVertical = new EventEmitter<void>();

  updateSize(dimension: 'width' | 'height', value: number) {
    if (this.image) {
      this.image[dimension] = value;
      this.imageChange.emit(this.image);
    }
  }

  updateOpacity(value: number) {
    if (this.image) {
      this.image.opacity = value;
      this.imageChange.emit(this.image);
    }
  }

  updateContrast(value: number) {
    if (this.image) {
      this.image.contrast = value;
      this.imageChange.emit(this.image);
    }
  }

  updateRotation(value: number) {
    if (this.image) {
      this.image.rotation = value;
      this.imageChange.emit(this.image);
    }
  }

  updateInverted(value: boolean) {
    if (this.image) {
      this.image.inverted = value;
      this.imageChange.emit(this.image);
    }
  }
}
