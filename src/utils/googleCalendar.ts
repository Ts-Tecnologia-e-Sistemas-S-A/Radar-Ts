import { CRMInteraction } from '../types';

export interface ContractDetailsOverride {
  winningCompany?: string;
  currentSystem?: string;
  contractValue?: number;
  contractDaysRemaining?: number;
  contractExpirationDate?: string;
  studentsCount?: number;
  schoolsCount?: number;
  contractItems?: string;
}

/**
 * Formats full CRM Interaction / Card details into a clean copyable text string
 * suitable for Google Calendar description or clipboard copying.
 */
export function formatCardDetailsForCalendar(
  interaction: CRMInteraction,
  contractInfo?: ContractDetailsOverride
): string {
  const muniName = interaction.municipalityName || 'Prefeitura';
  const state = interaction.state ? ` (${interaction.state})` : '';
  const dateStr = interaction.date ? interaction.date : 'Data não informada';
  const contactName = interaction.contactName || 'Contato não informado';
  const contactRole = interaction.contactRole ? ` (${interaction.contactRole})` : '';
  const dealOwner = interaction.dealOwner || 'José Badotti';
  const typeLabel = (interaction.type || 'visita').toUpperCase();
  const outcomeLabel = (interaction.outcome || 'positivo').toUpperCase();
  const nextStep = interaction.nextStep || 'Acompanhamento do processo comercial';
  const nextDueDate = interaction.nextStepDueDate || 'A definir';

  // Contract details extraction
  const winningCompany = contractInfo?.winningCompany || 'Empresa em Análise / Não Informada';
  const currentSystem = contractInfo?.currentSystem || 'Sistema Legado / Competidor';
  const contractValueFormatted = contractInfo?.contractValue 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractInfo.contractValue)
    : 'Valor não especificado';
  const daysRemaining = contractInfo?.contractDaysRemaining !== undefined ? `${contractInfo.contractDaysRemaining} dias` : 'Em verificação';
  const expirationDate = contractInfo?.contractExpirationDate || 'A consultar no PNCP/Transparência';
  const contractItems = contractInfo?.contractItems || 'Módulos de Gestão Pública / Serviços Contratados';

  return `🏛️ CARTÃO DE VISITA & COMPROMISSO COMERCIAL - SICAP

• Prefeitura: ${muniName}${state}
• Tipo de Ação: ${typeLabel}
• Data do Registro: ${dateStr}
• Contato Principal: ${contactName}${contactRole}
• Resultado / Status: ${outcomeLabel}
• Responsável Comercial: ${dealOwner}

📄 DADOS DO CONTRATO FIRMADO E SISTEMA ATUAL:
• Empresa Ganhadora / Fornecedora: ${winningCompany}
• Nome do Sistema em Uso: ${currentSystem}
• Valor do Contrato Vigente: ${contractValueFormatted}
• Vencimento / Prazo Restante: ${expirationDate} (${daysRemaining})
• Itens / Módulos Contratados: ${contractItems}

🎯 PRÓXIMA AÇÃO PROGRAMADA:
${nextStep}
📅 Data Limite / Vencimento do Follow-up: ${nextDueDate}

📌 RESUMO DO CONTATO:
${interaction.summary || 'Sem resumo registrado'}

📋 DESCRIÇÃO / ATA COMPLETA DA REUNIÃO:
${interaction.description || 'Sem descrição adicional'}

---
Gerado via Sistema SICAP - Formatador Automático de Cartões de Visita & Radar de Licitações`;
}

/**
 * Generates a direct Google Calendar event creation URL pre-populated with:
 * - Title: Compromisso + Next Step + Municipality
 * - Start/End Date: Based on nextStepDueDate (default 09:00 - 10:00 AM)
 * - Description: Full copy of the CRM Card
 * - Location: Municipality Name + State
 */
export function createGoogleCalendarUrl(interaction: CRMInteraction): string {
  const muniName = interaction.municipalityName || 'Prefeitura';
  const state = interaction.state ? ` - ${interaction.state}` : '';
  const nextStepTitle = interaction.nextStep || interaction.summary || 'Compromisso Comercial';

  const title = `🏛️ [SICAP] ${nextStepTitle} - ${muniName}${state}`;
  const details = formatCardDetailsForCalendar(interaction);
  const location = `Prefeitura Municipal de ${muniName}${state}`;

  // Parse date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  let datePart = interaction.nextStepDueDate || interaction.date || new Date().toISOString().slice(0, 10);
  // Remove hyphens if present
  const cleanDate = datePart.replace(/-/g, '').slice(0, 8); // e.g. "20260815"

  // Set event time: 09:00 to 10:00 AM on that date
  const startIso = `${cleanDate}T090000`;
  const endIso = `${cleanDate}T100000`;
  const datesParam = `${startIso}/${endIso}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar event creation interface in a new window/tab.
 */
export function openGoogleCalendar(interaction: CRMInteraction): void {
  const url = createGoogleCalendarUrl(interaction);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generates standard iCalendar (.ics) format string for an interaction.
 */
export function generateIcsContent(interaction: CRMInteraction): string {
  const muniName = interaction.municipalityName || 'Prefeitura';
  const state = interaction.state ? ` - ${interaction.state}` : '';
  const nextStepTitle = interaction.nextStep || interaction.summary || 'Compromisso Comercial';
  
  const title = `🏛️ [SICAP] ${nextStepTitle} - ${muniName}${state}`;
  const details = formatCardDetailsForCalendar(interaction).replace(/\n/g, '\\n');
  const location = `Prefeitura Municipal de ${muniName}${state}`;

  let datePart = interaction.nextStepDueDate || interaction.date || new Date().toISOString().slice(0, 10);
  const cleanDate = datePart.replace(/-/g, '').slice(0, 8); // e.g. "20260815"
  
  const dtStart = `${cleanDate}T090000Z`;
  const dtEnd = `${cleanDate}T100000Z`;
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `sicap-crm-${interaction.id}-${Date.now()}@sicap.gov.br`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SICAP Radar de Licitacoes//BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Downloads a single .ics calendar event file to import directly into Google Calendar or Outlook.
 */
export function downloadIcsFile(interaction: CRMInteraction): void {
  const icsText = generateIcsContent(interaction);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedMuni = (interaction.municipalityName || 'compromisso').toLowerCase().replace(/\s+/g, '-');
  link.download = `compromisso-sicap-${sanitizedMuni}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a batch .ics file containing all pending follow-up appointments.
 */
export function downloadBatchIcsFile(interactions: CRMInteraction[], filename: string = 'agenda-sicap-compromissos.ics'): void {
  const scheduledInteractions = interactions.filter(i => i.nextStepDueDate || i.nextStep);
  if (scheduledInteractions.length === 0) return;

  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const eventsList = scheduledInteractions.map(interaction => {
    const muniName = interaction.municipalityName || 'Prefeitura';
    const state = interaction.state ? ` - ${interaction.state}` : '';
    const nextStepTitle = interaction.nextStep || interaction.summary || 'Compromisso Comercial';
    
    const title = `🏛️ [SICAP] ${nextStepTitle} - ${muniName}${state}`;
    const details = formatCardDetailsForCalendar(interaction).replace(/\n/g, '\\n');
    const location = `Prefeitura Municipal de ${muniName}${state}`;

    let datePart = interaction.nextStepDueDate || interaction.date || new Date().toISOString().slice(0, 10);
    const cleanDate = datePart.replace(/-/g, '').slice(0, 8);
    
    const dtStart = `${cleanDate}T090000Z`;
    const dtEnd = `${cleanDate}T100000Z`;
    const uid = `sicap-crm-${interaction.id}@sicap.gov.br`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  const fullIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SICAP Radar de Licitacoes//BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    eventsList,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([fullIcs], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calls backend API to create event in Google Calendar API or return ready payload
 */
export async function syncEventWithGoogleCalendarApi(interaction: CRMInteraction, accessToken?: string): Promise<{ success: boolean; eventUrl?: string; message?: string }> {
  try {
    const res = await fetch('/api/calendar/sync-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interaction, accessToken }),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, eventUrl: json.eventUrl, message: json.message };
    }
    return { success: false, message: json.error || 'Erro na sincronização' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha de conexão com o servidor' };
  }
}
