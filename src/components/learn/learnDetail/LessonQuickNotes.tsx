import { Lightbulb } from 'lucide-react';
import '../../../styles/components/learnDetail/_lesson-quick-notes.scss';

interface LessonQuickNotesProps {
  notes: string[];
  tip?: { title: string; content: string };
}

export default function LessonQuickNotes({ notes, tip }: LessonQuickNotesProps) {
  const hasNotes = notes.length > 0;
  const hasTip = !!tip?.title && !!tip?.content;
  if (!hasNotes && !hasTip) return null;

  return (
    <div className="lesson-quick-notes">
      {hasNotes && (
        <>
          <h2 className="lesson-quick-notes__title">Ghi chú nhanh</h2>
          <ol className="lesson-quick-notes__list">
            {notes.map((note, index) => (
              <li key={index} className="lesson-quick-notes__item">
                {note}
              </li>
            ))}
          </ol>
        </>
      )}
      {tip && (
        <div className="lesson-quick-notes__tip">
          <div className="lesson-quick-notes__tip-icon">
            <Lightbulb size={24} />
          </div>
          <div className="lesson-quick-notes__tip-content">
            <strong className="lesson-quick-notes__tip-title">{tip.title}</strong>
            <p className="lesson-quick-notes__tip-text">{tip.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}
