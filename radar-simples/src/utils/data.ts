export function dataBr(data: string | undefined): string {
  if (!data) return 'Data não informada';
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!correspondencia) return data;
  const [, ano, mes, dia] = correspondencia;
  return `${dia}/${mes}/${ano.slice(-2)}`;
}

export function dataHoraBr(valor: string | Date): string {
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  const doisDigitos = (numero: number) => String(numero).padStart(2, '0');
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${doisDigitos(data.getFullYear() % 100)} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}
