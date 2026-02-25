import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AjInput, Button, Link } from 'ui';

@Component({
  selector: 'app-playground',
  imports: [ReactiveFormsModule, AjInput, Button, Link],
  templateUrl: './playground.html',
})
export class Playground {
  readonly query = new FormControl<string>('');
}

