import { POKE_MESSAGES } from './friend.model';
import { FeedItem } from './group.model';

// Texto de cada entrada del muro. Los documentos guardan solo el tipo y un dato, así que los
// mensajes se pueden cambiar o traducir sin migrar nada.

const POKES_BY_ID = new Map(POKE_MESSAGES.map((message) => [message.id, message]));

export function feedText(name: string, item: FeedItem): { text: string; discreto: string } {
  switch (item.kind) {
    case 'mensaje': {
      const message = item.msg ? POKES_BY_ID.get(item.msg) : undefined;
      return message
        ? { text: `${name}: ${message.emoji} ${message.text}`, discreto: `${name}: ${message.discreto}` }
        : { text: `${name} ha dicho algo`, discreto: `${name} ha dicho algo` };
    }
    case 'adelanta':
      return {
        text: item.msg ? `🏃 ${name} ha adelantado a ${item.msg}` : `🏃 ${name} ha adelantado a alguien`,
        discreto: item.msg ? `${name} ha adelantado a ${item.msg}` : `${name} ha adelantado a alguien`,
      };
    case 'racha':
      return { text: `🔥 ${name} lleva ${item.msg ?? '?'} días de racha`, discreto: `${name} lleva una buena racha` };
    case 'campeon':
      return { text: `👑 ${name} ha ganado ${item.msg ?? 'el mes'}`, discreto: `${name} ha ganado ${item.msg ?? 'el mes'}` };
    case 'objetivo':
      return { text: `🎉 ${name} ha rematado el objetivo del grupo`, discreto: `${name} ha rematado el objetivo` };
  }
}
