import '../../../styles/components/learnDetail/_lesson-summary.scss';

interface SummarySection {
  title: string;
  content: string;
}

interface LessonSummaryProps {
  sections: SummarySection[];
}

export default function LessonSummary({ sections }: LessonSummaryProps) {
  return (
    <div className="lesson-summary">
      <h2 className="lesson-summary__title">Tóm tắt nội dung</h2>
      <div className="lesson-summary__content">
        {sections.map((section, index) => (
          <div key={index} className="lesson-summary__section">
            {section.title && <h3 className="lesson-summary__section-title">{section.title}</h3>}
            {section.content.trim().startsWith('<') ||
            /<[a-z]/.test(section.content) ? (
              <div
                className="lesson-summary__section-content"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            ) : (
              <p className="lesson-summary__section-content">{section.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
