# Blueprint — #122

Reutilizar `ManagementShell`, `useQuery`, `http`, `useTeachers`, feedback states e Zod. O serviço chama `/belt-validations?date=YYYY-MM-DD&teacherId=UUID`; mutation usa `PATCH /belt-validations/:id/approve`. O `SessionProvider` fornece token em memória ao interceptor Axios.
