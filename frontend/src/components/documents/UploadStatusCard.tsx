import { useDocument } from '../../api/documents'
import type { DocumentStatus, AiMetadata } from '../../types'

interface UploadStatusCardProps {
  documentId: string
}

interface Step {
  key: string
  label: string
  condition: (status: DocumentStatus, ai: AiMetadata | null) => 'done' | 'current' | 'pending'
}

const steps: Step[] = [
  {
    key: 'uploading',
    label: 'Uploading',
    condition: (s) => (s === 'Processing' || s === 'Published' || s === 'Rejected' ? 'done' : s === 'Draft' ? 'current' : 'pending'),
  },
  {
    key: 'extracting',
    label: 'Extracting text',
    condition: (s, ai) =>
      ai?.processingStatus === 'Completed' || ai?.processingStatus === 'Failed'
        ? 'done'
        : ai?.processingStatus === 'Processing'
          ? 'current'
          : s === 'Draft'
            ? 'pending'
            : 'current',
  },
  {
    key: 'analyzing',
    label: 'AI analyzing',
    condition: (_, ai) =>
      ai?.processingStatus === 'Completed'
        ? 'done'
        : ai?.processingStatus === 'Failed'
          ? 'done'
          : ai?.processingStatus === 'Processing'
            ? 'current'
            : 'pending',
  },
  {
    key: 'ready',
    label: 'Ready',
    condition: (s) => (s === 'Published' ? 'done' : s === 'Rejected' ? 'done' : 'pending'),
  },
]

function StepIcon({ state }: { state: 'done' | 'current' | 'pending' }) {
  if (state === 'done')
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  if (state === 'current')
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-iupa-green">
        <span className="h-2 w-2 animate-ping rounded-full bg-iupa-green" />
      </span>
    )
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-iupa-light text-iupa-medium">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  )
}

export default function UploadStatusCard({ documentId }: UploadStatusCardProps) {
  const { data: doc, isLoading, isError } = useDocument(documentId)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-iupa-light bg-iupa-white p-4 shadow-sm">
        <p className="text-sm text-iupa-medium">Loading status...</p>
      </div>
    )
  }

  if (isError || !doc) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Failed to load document status</p>
      </div>
    )
  }

  if (doc.status === 'Rejected') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700">Processing failed</p>
        {doc.aiMetadata?.errorMessage && (
          <p className="mt-1 text-xs text-red-500">{doc.aiMetadata.errorMessage}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-iupa-light bg-iupa-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-iupa-dark">Upload Status</h3>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const state = step.condition(doc.status, doc.aiMetadata)
          return (
            <div key={step.key} className="flex items-center gap-3">
              <StepIcon state={state} />
              <span
                className={`text-sm ${
                  state === 'done'
                    ? 'text-iupa-medium line-through'
                    : state === 'current'
                      ? 'font-medium text-iupa-green'
                      : 'text-iupa-medium'
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && state === 'done' && (
                <svg
                  className="ml-auto h-4 w-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          )
        })}
      </div>

      {doc.aiMetadata?.summary && (
        <div className="mt-4 rounded bg-iupa-light p-3">
          <p className="mb-1 text-xs font-medium text-iupa-medium">AI Summary Preview</p>
          <p className="text-sm text-iupa-dark">{doc.aiMetadata.summary}</p>
        </div>
      )}
    </div>
  )
}
