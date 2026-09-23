import type { LegalDoc } from '@/lib/legal-content';

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{doc.title}</h1>
      <p className="text-sm text-gray-500 mt-2">{doc.updated}</p>
      <p className="text-gray-700 leading-relaxed mt-6">{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
          {s.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mt-2">{p}</p>
          ))}
          {s.bullets && (
            <ul className="list-disc pl-6 mt-2 space-y-1.5 text-gray-700 leading-relaxed">
              {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
