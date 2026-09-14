import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { Fap } from '../../shared/fap.model';

@Component({
  selector: 'app-sumar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './sumar.page.html',
  styleUrl: './sumar.page.scss',
})
export class SumarPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private router = inject(Router);

  displayName = '';
  numberC = 0;
  numberS = 0;
  numberTotal = 0;
  showLoader = true;

  private faps: Fap[] = [];
  private authSub?: Subscription;
  private fapsSub?: Subscription;

  ngOnInit(): void {
    this.authSub = this.authService.user$.subscribe((user) => {
      this.fapsSub?.unsubscribe();

      if (!user) {
        this.displayName = '';
        this.faps = [];
        this.numberC = 0;
        this.numberS = 0;
        this.numberTotal = 0;
        this.showLoader = false;
        return;
      }

      this.displayName = user.displayName ?? user.email ?? '';
      this.showLoader = true;
      this.fapsSub = this.fapService.fapsForUser$(user.uid).subscribe((faps) => {
        this.faps = faps;
        this.numberC = faps.filter((fap) => !fap.solitario).length;
        this.numberS = faps.filter((fap) => fap.solitario).length;
        this.numberTotal = faps.length;
        this.showLoader = false;
      });
    });
  }

  async sumar(solitario: boolean): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    await this.fapService.addFap(uid, solitario);
  }

  async borrar(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid || this.faps.length === 0) {
      return;
    }
    await this.fapService.removeLastFap(uid);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.fapsSub?.unsubscribe();
  }
}
