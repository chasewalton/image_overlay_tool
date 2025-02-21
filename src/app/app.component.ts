import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageOverlayComponent } from './components/image-overlay/image-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ImageOverlayComponent],
  template: `
    <div class="app-container">
      <h1>Image Overlay Tool</h1>
      <app-image-overlay></app-image-overlay>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 1rem;
      
      h1 {
        margin-bottom: 1rem;
        color: #333;
      }
    }
  `]
})
export class AppComponent {
  title = 'image-overlay-tool';
}
