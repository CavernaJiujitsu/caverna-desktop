# Implementação — #104

A consulta visual de aulas/inscritos usa API real e o serviço/hook de chamada usa `POST /classes/:classId/enrollments/:enrollmentId/check-in`, com autenticação Bearer em memória. A ação visual pode ser refinada no próximo passe de UI sem simular confirmação.
