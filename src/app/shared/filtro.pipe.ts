import { Pipe, PipeTransform } from '@angular/core';

interface Filtrable {
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
}

// Filtra por prefijo (sin distinguir mayúsculas) de email, displayName o name.
@Pipe({
  name: 'filtro',
  standalone: true,
})
export class FiltroPipe implements PipeTransform {
  transform<T extends Filtrable>(items: T[] | null | undefined, texto = ''): T[] {
    if (!items) {
      return [];
    }

    const term = texto.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter((item) =>
      [item.email, item.displayName, item.name].some((value) => value?.toLowerCase().startsWith(term))
    );
  }
}
