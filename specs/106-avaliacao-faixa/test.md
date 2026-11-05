# Testes — #106

O teste da mutation de aprovação foi adicionado. Rejeição permanece pendente até a UI consumir o catálogo de faixas; não é simulada com IDs fictícios.
O cliente Axios agora lê a sessão persistida pelo `SessionProvider` e envia `Authorization: Bearer <accessToken>`; `axios-auth.test.ts` cobre esse contrato.
