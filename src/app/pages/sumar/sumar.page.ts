import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AchievementsService } from '../../core/achievements.service';
import { AuthService } from '../../core/auth.service';
import { FapRef, FapService } from '../../core/fap.service';
import { SettingsService } from '../../core/settings.service';
import { UiService } from '../../core/ui.service';
import { FapDetailsModal } from '../../components/fap-details/fap-details.modal';
import { DatoDirective } from '../../shared/dato.directive';
import { FapDetails, FapStats } from '../../shared/fap.model';
import { currentMonthTotals, currentWeekTotals } from '../../shared/stats';
import { AddPastFapModal, PastFap } from './add-past-fap.modal';

interface GoalView {
  label: string;
  done: number;
  target: number;
  progress: number;
}

@Component({
  selector: 'app-sumar',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, DatoDirective],
  templateUrl: './sumar.page.html',
  styleUrl: './sumar.page.scss',
})
export class SumarPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private modalController = inject(ModalController);
  private ui = inject(UiService);
  private settings = inject(SettingsService);
  private achievements = inject(AchievementsService);

  readonly neutral = computed(() => this.settings.discreet().enabled && this.settings.discreet().neutralName);

  displayName = '';
  numberC = 0;
  numberS = 0;
  numberTotal = 0;
  goals: GoalView[] = [];
  showLoader = true;

  private stats: FapStats | null = null;
  private authSub?: Subscription;
  private statsSub?: Subscription;

  ngOnInit(): void {
    this.authSub = this.authService.user$.subscribe((user) => {
      this.statsSub?.unsubscribe();

      if (!user) {
        this.displayName = '';
        this.numberC = this.numberS = this.numberTotal = 0;
        this.goals = [];
        this.showLoader = false;
        return;
      }

      this.displayName = user.displayName ?? user.email ?? '';
      this.showLoader = true;
      this.statsSub = this.fapService.stats$(user.uid).subscribe((stats) => {
        const previousGoals = this.goals;
        this.stats = stats;
        this.numberC = stats.compania;
        this.numberS = stats.solitario;
        this.numberTotal = stats.compania + stats.solitario;
        this.goals = this.buildGoals(stats);
        this.showLoader = false;
        this.celebrateGoals(previousGoals, this.goals);
      });
    });
  }

  private buildGoals(stats: FapStats): GoalView[] {
    const now = new Date();
    const goals: GoalView[] = [];
    const add = (label: string, done: number, target: number | null | undefined) => {
      if (target) {
        goals.push({ label, done, target, progress: Math.min(1, done / target) });
      }
    };
    add('Objetivo de la semana', currentWeekTotals(stats.days, now).total, stats.goals.semana);
    add('Objetivo del mes', currentMonthTotals(stats.days, now).total, stats.goals.mes);
    return goals;
  }

  // Aviso al cruzar un objetivo en esta sesión (no al abrir la app con él ya cumplido).
  private celebrateGoals(before: GoalView[], after: GoalView[]): void {
    const reached = after.find((goal) => {
      const previous = before.find((b) => b.label === goal.label);
      return previous && previous.done < previous.target && goal.done >= goal.target;
    });
    if (reached) {
      void this.ui.toast(`🎯 ¡${reached.label} cumplido!`);
    }
  }

  async sumar(solitario: boolean): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const fap = await this.fapService.addFap(uid, solitario);
    void this.achievements.announceNew(uid);
    await this.offerUndo(uid, fap, solitario ? 'Sumada en solitario' : 'Sumada en compañía');
  }

  // "Deshacer" y "Detalles" durante unos segundos tras sumar.
  private async offerUndo(uid: string, fap: FapRef, message: string): Promise<void> {
    const action = await this.ui.actionToast(message, [
      { text: 'Detalles', role: 'details' },
      { text: 'Deshacer', role: 'undo' },
    ]);
    if (action === 'undo') {
      await this.fapService.removeFap(uid, fap);
      await this.ui.toast('Deshecho');
    } else if (action === 'details') {
      await this.editDetails(uid, fap);
    }
  }

  async editDetails(uid: string, fap: FapRef): Promise<void> {
    const modal = await this.modalController.create({
      component: FapDetailsModal,
      componentProps: {
        details: fap,
        knownTags: this.knownTags(),
        subtitle: fap.fecha ? capitalize(format(fap.fecha, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })) : '',
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<FapDetails>();
    if (role === 'confirm' && data) {
      await this.fapService.updateDetails(uid, fap, data);
      await this.ui.toast('Detalles guardados');
    }
  }

  private knownTags(): string[] {
    return Object.entries(this.stats?.tags ?? {})
      .filter(([, bucket]) => (bucket.s ?? 0) + (bucket.c ?? 0) > 0)
      .sort((a, b) => (b[1].s ?? 0) + (b[1].c ?? 0) - ((a[1].s ?? 0) + (a[1].c ?? 0)))
      .map(([tag]) => tag);
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
      const fap = await this.fapService.addFap(uid, data.solitario, data.fecha);
      void this.achievements.announceNew(uid);
      await this.offerUndo(uid, fap, `Añadida: ${format(data.fecha, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}`);
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

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.statsSub?.unsubscribe();
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

