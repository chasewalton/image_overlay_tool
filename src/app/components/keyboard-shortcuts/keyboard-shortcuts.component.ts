import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Shortcut {
  keys: string;
  description: string;
}

@Component({
  selector: 'app-keyboard-shortcuts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="keyboard-shortcuts">
      <h4>Keyboard Shortcuts:</h4>
      <div class="shortcuts-grid">
        <div class="shortcut" *ngFor="let shortcut of shortcuts">
          <span class="key">{{ shortcut.keys }}</span>
          <span class="description">{{ shortcut.description }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .keyboard-shortcuts {
      padding: 1rem;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-top: 1rem;

      h4 {
        margin: 0 0 1rem 0;
        color: #333;
      }
    }

    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .shortcut {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .key {
      padding: 0.2rem 0.5rem;
      background: #eee;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .description {
      color: #666;
    }
  `]
})
export class KeyboardShortcutsComponent {
  shortcuts: Shortcut[] = [
    { keys: 'W,A,S,D', description: 'Move image' },
    { keys: 'Q,E', description: 'Rotate' },
    { keys: 'Z,X', description: 'Opacity' },
    { keys: 'C,V', description: 'Contrast' },
    { keys: 'F,G', description: 'Resize smaller/bigger' },
    { keys: 'Left Shift', description: 'Toggle overlay visibility' }
  ];
}
