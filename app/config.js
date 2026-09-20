/* ============================================================
   Configuração do Supabase.

   A chave publicável (sb_publishable_...) é feita para ficar à vista,
   no navegador. Publicá-la não abre nada: quem protege o dado é a
   política dentro do banco (RLS), ligada à pessoa logada.

   NUNCA coloque aqui a chave service_role — ela ignora todas as regras
   de acesso e, se chegar ao navegador, o dado dos dois fica aberto.
   ============================================================ */
window.SUPABASE = {
  url: 'https://ulznovyrflgglroglymv.supabase.co',
  chave: 'sb_publishable_9hNheMnVK-R8dkn7Tu-_0Q_97fhBThK'
};
