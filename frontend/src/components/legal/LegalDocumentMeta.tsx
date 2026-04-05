type Revision = {
  date: string
  note: string
}

type LegalDocumentMetaProps = {
  updatedAt: string
  revisions: Revision[]
}

export default function LegalDocumentMeta({ updatedAt, revisions }: LegalDocumentMetaProps) {
  return (
    <section className="space-y-4 rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
      <p className="text-xs text-gray-500 dark:text-gray-400">最終更新日: {updatedAt}</p>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">改定履歴</h2>
        <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
          {revisions.map((revision) => (
            <li key={`${revision.date}-${revision.note}`} className="flex gap-2">
              <span className="font-mono text-gray-400 dark:text-gray-500">{revision.date}</span>
              <span>{revision.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
