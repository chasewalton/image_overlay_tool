import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <label [for]="uniqueId" class="upload-label">
        <span>{{ label }}</span>
        <input
          [id]="uniqueId"
          type="file"
          [accept]="accept"
          (change)="onFileSelected($event)"
          class="file-input"
        >
      </label>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upload-label {
      display: inline-block;
      padding: 8px 16px;
      background-color: #007bff;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #0056b3;
      }
    }

    .file-input {
      display: none;
    }
  `]
})
export class ImageUploadComponent {
  @Input() label = 'Upload Image';
  @Input() accept = 'image/*';
  @Output() fileSelected = new EventEmitter<File>();

  private static idCounter = 0;
  uniqueId = `file-upload-${ImageUploadComponent.idCounter++}`;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileSelected.emit(input.files[0]);
    }
  }
}
