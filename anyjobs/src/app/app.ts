import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MediaPlaybackService } from './shared/media/media-playback.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('anyjobs');

  constructor() {
    inject(MediaPlaybackService);
  }
}
