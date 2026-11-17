import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'
import { ManagementShell } from '@/features/management/components/management-shell'
import { PageHeader } from '@/shared/components/layout/page-header'
import { PractitionerCreateForm } from '@/features/practitioners/components/practitioner-create-form'

export default function PractitionerCreatePage() {
  return (
    <ManagementShell>
      <PageHeader
        title="Cadastrar aluno"
        description="Crie o cadastro do aluno e matricule-o em uma unidade na tela de alunos."
      />
      <div className="max-w-xl">
        <div className="mb-4 flex items-center gap-2">
          <Link
            to={routes.memberships}
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para alunos
          </Link>
        </div>
        <PractitionerCreateForm />
      </div>
    </ManagementShell>
  )
}
