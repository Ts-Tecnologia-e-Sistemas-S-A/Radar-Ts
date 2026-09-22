import * as tls from 'node:tls';

let configurado = false;
/** Inclui CAs confiáveis do sistema; nunca desabilita a validação HTTPS. */
export function configurarCertificadosSistema() {
  if (!configurado && typeof tls.setDefaultCACertificates === 'function') {
    tls.setDefaultCACertificates([...tls.getCACertificates('default'), ...tls.getCACertificates('system')]);
    configurado = true;
  }
}
