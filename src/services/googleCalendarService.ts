import { CustomerOrder } from '../types';
import { formatCurrency } from './storageService';

export class GoogleCalendarService {
  /**
   * Create an event in primary Google Calendar using OAuth access token
   */
  static async scheduleOrderEvent(order: CustomerOrder, accessToken: string): Promise<{ success: boolean; eventId: string; id: string; htmlLink: string }> {
    const deliveryDateStr = order.deliveryDate; // YYYY-MM-DD
    const timeStr = order.deliveryTime || '17:00'; // HH:mm

    const startDateTime = new Date(`${deliveryDateStr}T${timeStr}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const itemsSummary = order.items.map(i => {
      const mode = i.saleMode === 'lisa' ? '[LISA]' : '[ESTAMPADA]';
      return `• ${i.quantity}x ${i.productName} ${mode}${i.size ? ` (Talle ${i.size})` : ''}${i.customizationDetails ? ` - Diseño: ${i.customizationDetails}` : ''}`;
    }).join('\n');

    const eventPayload = {
      summary: `👕 [Sublimación] Entrega ${order.orderNumber} - ${order.customerName}`,
      description: `ORDEN DE TRABAJO - SUBLISTOCK PRO\n\n` +
        `Cliente: ${order.customerName}\n` +
        `Teléfono/WhatsApp: ${order.customerPhone}\n` +
        `Total: ${formatCurrency(order.totalAmount)}\n` +
        `Seña abonada: ${formatCurrency(order.depositAmount)}\n` +
        `Saldo contra entrega: ${formatCurrency(order.remainingBalance)}\n\n` +
        `ÍTEMS A ENTREGAR:\n${itemsSummary}\n\n` +
        (order.notes ? `Notas: ${order.notes}\n\n` : '') +
        `Generado automáticamente desde SubliStock Pro Taller Gráfico.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 120 }, // 2 hours before
          { method: 'popup', minutes: 1440 }  // 1 day before
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error al crear evento en Google Calendar: ${response.statusText}`);
    }

    const createdEvent = await response.json();
    return {
      success: true,
      eventId: createdEvent.id,
      id: createdEvent.id,
      htmlLink: createdEvent.htmlLink
    };
  }

  /**
   * Generates a direct web Google Calendar link so users can also one-click open in web/mobile Google Calendar
   */
  static createCalendarWebUrl(order: CustomerOrder): string {
    const deliveryDateStr = order.deliveryDate;
    const timeStr = order.deliveryTime ? order.deliveryTime.replace(':', '') : '1700';

    const cleanDate = deliveryDateStr.replace(/-/g, '');
    const startStr = `${cleanDate}T${timeStr}00`;
    const endStr = `${cleanDate}T${String(parseInt(timeStr.slice(0, 2)) + 1).padStart(2, '0')}${timeStr.slice(2)}00`;

    const title = encodeURIComponent(`👕 [Sublimación] Entrega ${order.orderNumber} - ${order.customerName}`);
    const details = encodeURIComponent(
      `Cliente: ${order.customerName} (${order.customerPhone})\n` +
      `Total: ${formatCurrency(order.totalAmount)} | Saldo: ${formatCurrency(order.remainingBalance)}\n` +
      order.items.map(i => `• ${i.quantity}x ${i.productName} (${i.saleMode === 'lisa' ? 'Lisa' : 'Estampada'})`).join('\n')
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  }

  static getGoogleCalendarWebLink(order: CustomerOrder): string {
    return this.createCalendarWebUrl(order);
  }
}
