import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { UiService } from '../../core/ui.service';
import { AddPastFapModal, PastFap } from './add-past-fap.modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  private modalController = inject(ModalController);
  private ui = inject(UiService);

  displayName = '';
  numberC = 0;
  numberS = 0;
  numberTotal = 0;
  showLoader = true;

  private authSub?: Subscription;
  private fapsSub?: Subscription;

  ngOnInit(): void {
    this.authSub = this.authService.user$.subscribe((user) => {
      this.fapsSub?.unsubscribe();

      if (!user) {
        this.displayName = '';
        this.numberC = 0;
        this.numberS = 0;
        this.numberTotal = 0;
        this.showLoader = false;
        return;
      }

      this.displayName = user.displayName ?? user.email ?? '';
      this.showLoader = true;
      this.fapsSub = this.fapService.fapCounts$(user.uid).subscribe((counts) => {
        this.numberC = counts?.compania ?? 0;
        this.numberS = counts?.solitario ?? 0;
        this.numberTotal = this.numberC + this.numberS;
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

  async sumarOlvidada(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const modal = await this.modalController.create({ component: AddPastFapModal });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<PastFap>();
    if (role !== 'confirm' || !data) {
      return;
    }
    try {
      await this.fapService.addFap(uid, data.solitario, data.fecha);
      await this.ui.toast(`Añadida: ${format(data.fecha, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}`);
    } catch (error) {
      console.error('Error añadiendo fap olvidado', error);
      await this.ui.toast('No se pudo añadir');
    }
  }

  async borrar(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
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
