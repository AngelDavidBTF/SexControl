import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtro'
})
export class FiltroPipe implements PipeTransform {

  transform(array: any[], texto: string = '', email: string = ''): any [] {
      if( texto === '' ) {
        return array;
      }

      if( !array ) {
        return array;
      }

      texto = texto.toLowerCase();

      return array.filter(
        item => {
          if ( item && item.email && item.email.toLowerCase().startsWith( texto ) ) {
            return item.email.toLowerCase().startsWith( texto )           
          } else if (item && item.displayName && item.displayName.toLowerCase().startsWith( texto )) {
            return item.displayName.toLowerCase().startsWith( texto )
          } else if ( item && item.name && item.name.toLowerCase().startsWith( texto ) ) {
            return item.name.toLowerCase().startsWith( texto )
          }
        }
      );
  }

}
