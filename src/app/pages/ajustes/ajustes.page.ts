import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom, of, switchMap } from 'rxjs';
import { AccountService } from '../../core/account.service';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { InstallService } from '../../core/install.service';
import { ProfileService } from '../../core/profile.service';
import { RemindersService } from '../../core/reminders.service';
import { SettingsService, ThemeMode } from '../../core/settings.service';
import { SharingService } from '../../core/sharing.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { resizeImageToDataUrl } from '../../shared/image';

// Foto de perfil pequeña: se copia en las listas de amigos y grupos, así que debe ocupar poco.
const AVATAR_SIZE = 64;

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent],
  templateUrl: './ajustes.page.html',
  styleUrl: './ajustes.page.scss',
})
export class AjustesPage implements OnInit, OnDestroy {
  readonly settings = inject(SettingsService);
  readonly install = inject(InstallService);
  private auth = inject(AuthService);
  private account = inject(AccountService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private sharing = inject(SharingService);
  private profiles = inject(ProfileService);
  private reminders = inject(RemindersService);
  private ui = inject(UiService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  readonly dayOptions = [1, 2, 3, 4, 5, 7, 10, 14];
  readonly hourOptions = Array.from({ length: 24 }, (_, h) => h);

  email = '';
  displayName = '';
  photoURL: string | null = null;
  profileDirty = false;
  savingProfile = false;

  goalWeek: number | null = null;
  goalMonth: number | null = null;
  goalsDirty = false;
  paused = false;

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.auth.user$
      .pipe(
        switchMap((user) =>
          user
            ? combineLatest([this.profiles.profile$(user.uid), this.fapService.stats$(user.uid), this.friendsService.social$(user.uid)])
            : of(null)
        )
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        const [profile, stats, social] = data;
        this.email = profile.email ?? '';
        if (!this.profileDirty) {
          this.displayName = profile.displayName ?? '';
          this.photoURL = profile.photoURL;
        }
        // No pisar lo que el usuario está escribiendo con actualizaciones del documento.
        if (!this.goalsDirty) {
          this.goalWeek = stats.goals.semana ?? null;
          this.goalMonth = stats.goals.mes ?? null;
        }
        this.paused = social.paused;
      });
  }

  // ---------------------------------------------------------------- perfil

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    try {
      this.photoURL = await resizeImageToDataUrl(file, AVATAR_SIZE, 0.7);
      this.profileDirty = true;
    } catch {
      await this.ui.toast('No se pudo cargar la imagen');
    }
  }

  removePhoto(): void {
    this.photoURL = null;
    this.profileDirty = true;
  }

  async saveProfile(): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid || !this.displayName.trim()) {
      await this.ui.toast('El nombre no puede estar vacío');
      return;
    }
    this.savingProfile = true;
    try {
      await this.account.updateProfile(uid, this.displayName, this.photoURL);
      this.profileDirty = false;
      await this.ui.toast('Perfil actualizado');
    } catch (error) {
      console.error('Error guardando perfil', error);
      await this.ui.toast('No se pudo guardar el perfil');
    } finally {
      this.savingProfile = false;
    }
  }

  // ---------------------------------------------------------------- objetivos y privacidad

  async saveGoals(): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid) {
      return;
    }
    const clean = (value: number | null) => (value && value > 0 ? Math.min(999, Math.round(value)) : null);
    await this.fapService.setGoals(uid, { semana: clean(this.goalWeek), mes: clean(this.goalMonth) });
    this.goalsDirty = false;
    await this.ui.toast('Objetivos guardados');
  }

  async onPausedChange(event: CustomEvent): Promise<void> {
    const uid = this.auth.currentUid();
    if (!uid) {
      return;
    }
    const paused = event.detail.checked === true;
    await this.friendsService.setPaused(uid, paused);
    await this.sharing.publish(uid, await firstValueFrom(this.fapService.stats$(uid)));
    await this.ui.toast(paused ? 'Has dejado de compartir tus números' : 'Vuelves a compartir tus números');
  }

  // ---------------------------------------------------------------- recordatorios

  async onRemindersChange(event: CustomEvent): Promise<void> {
    const enabled = event.detail.checked === true;
    if (enabled && !(await this.reminders.requestPermission())) {
      this.settings.updateReminders({ enabled: false });
      await this.ui.alertaInformativa('Para recibir recordatorios, permite las notificaciones de la app en tu dispositivo.');
      return;
    }
    this.settings.updateReminders({ enabled });
  }

  // ---------------------------------------------------------------- modo discreto

  onDiscreetChange(event: CustomEvent): void {
    this.settings.updateDiscreet({ enabled: event.detail.checked === true });
  }

  async onLockChange(event: CustomEvent): Promise<void> {
    if (event.detail.checked === true) {
      if (!(await this.askNewPin())) {
        this.settings.updateDiscreet({ lock: false });
      }
    } else {
      this.settings.removePin();
    }
  }

  async changePin(): Promise<void> {
    await this.askNewPin();
  }

  private async askNewPin(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'PIN de bloqueo',
      message: 'Elige 4 cifras. Si lo olvidas tendrás que volver a iniciar sesión.',
      inputs: [
        { name: 'pin', type: 'password', placeholder: 'PIN', attributes: { inputmode: 'numeric', maxlength: 4 } },
        { name: 'repeat', type: 'password', placeholder: 'Repite el PIN', attributes: { inputmode: 'numeric', maxlength: 4 } },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { data, role } = await alert.onDidDismiss<{ values: { pin: string; repeat: string } }>();
    if (role !== 'confirm') {
      return false;
    }
    const { pin, repeat } = data?.values ?? { pin: '', repeat: '' };
    if (!/^\d{4}$/.test(pin) || pin !== repeat) {
      await this.ui.toast('El PIN debe tener 4 cifras y coincidir');
      return false;
    }
    await this.settings.setPin(pin);
    await this.ui.toast('PIN guardado');
    return true;
  }

  setTheme(event: CustomEvent): void {
    this.settings.setTheme(event.detail.value as ThemeMode);
  }

  async installApp(): Promise<void> {
    if (await this.install.install()) {
      await this.ui.toast('¡App instalada!');
    }
  }

  // ---------------------------------------------------------------- cuenta

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  async confirmDeleteAccount(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      return;
    }
    const needsPassword = this.auth.isPasswordUser(user);
    const alert = await this.alertController.create({
      header: 'Borrar cuenta',
      message: needsPassword
        ? 'Se borrarán para siempre tus registros, estadísticas, amistades y grupos que hayas creado. Introduce tu contraseña para confirmar.'
        : 'Se borrarán para siempre tus registros, estadísticas, amistades y grupos que hayas creado. Tendrás que confirmar con Google.',
      inputs: needsPassword ? [{ name: 'password', type: 'password', placeholder: 'Contraseña' }] : [],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar todo', role: 'destructive' },
      ],
    });
    await alert.present();
    const { data, role } = await alert.onDidDismiss<{ values: { password?: string } }>();
    if (role !== 'destructive') {
      return;
    }
    const loading = await this.ui.loading('Borrando tu cuenta…');
    try {
      await this.auth.reauthenticate(data?.values?.password ?? null);
      await this.account.deleteAccount(user.uid);
      this.settings.removePin();
      await this.router.navigate(['/login'], { replaceUrl: true });
      await this.ui.toast('Tu cuenta se ha borrado');
    } catch (error) {
      console.error('Error borrando la cuenta', error);
      await this.ui.alertaInformativa(this.auth.errorMessage(error));
    } finally {
      await loading.dismiss();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
