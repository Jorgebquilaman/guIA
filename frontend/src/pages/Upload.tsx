import UploadForm from '../components/documents/UploadForm'
import Card from '../components/ui/Card'

export default function Upload() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-iupa-dark">Subir documentos</h1>
        <p className="mt-1 text-sm text-iupa-medium">
          Arrastra tus archivos o hacé clic para seleccionarlos. El sistema procesará y analizará el contenido automáticamente.
        </p>
      </div>

      <Card>
        <UploadForm />
      </Card>
    </div>
  )
}
