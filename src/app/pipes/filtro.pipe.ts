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
          if ( item.data && item.data.email && item.data.email.toLowerCase().startsWith( texto ) ) {
            return item.data.email.toLowerCase().startsWith( texto )           
          } else if (item.data && item.data.displayName && item.data.displayName.toLowerCase().startsWith( texto )) {
            return item.data.displayName.toLowerCase().startsWith( texto )
          } else if ( item.data && item.data.name && item.data.name.toLowerCase().startsWith( texto ) ) {
            return item.data.name.toLowerCase().startsWith( texto )
          }
        }
      );
  }

}
