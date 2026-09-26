export function dataBr(data: string | undefined): string {
  if (!data) return 'Data não informada';
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!correspondencia) return data;
  const [, ano, mes, dia] = correspondencia;
  return `${dia}/${mes}/${ano.slice(-2)}`;
}
