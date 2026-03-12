import { useState } from 'react';
import { Heart, Bookmark, Share2, User, Eye, Clock } from 'lucide-react';
import '../../../styles/components/learnDetail/_lesson-header.scss';

interface LessonHeaderProps {
  title: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt?: string;
  viewCount?: number;
  /** Lesson ID – dùng cho like/save khi có auth */
  lessonId?: number;
  /** Artisan/Author ID – dùng cho follow khi có auth */
  artisanId?: number;
  onLike?: () => Promise<boolean>;
  onSave?: () => Promise<boolean>;
  onFollow?: () => Promise<boolean>;
}

export default function LessonHeader({
  title,
  authorName,
  authorAvatar,
  publishedAt = '2 ngày trước',
  viewCount = 2400,
  lessonId,
  artisanId,
  onLike,
  onSave,
  onFollow,
}: LessonHeaderProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (!onLike || busy) return;
    setBusy(true);
    try {
      const next = await onLike();
      setLiked(next);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || busy) return;
    setBusy(true);
    try {
      const next = await onSave();
      setSaved(next);
    } finally {
      setBusy(false);
    }
  };

  const handleFollow = async () => {
    if (!onFollow || busy) return;
    setBusy(true);
    try {
      const next = await onFollow();
      setFollowing(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lesson-header">
      <h1 className="lesson-header__title">{title}</h1>
      <div className="lesson-header__meta">
        <div className="lesson-header__author">
          <div className="lesson-header__avatar">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="lesson-header__author-info">
            <div className="lesson-header__author-name">{authorName}</div>
            <div className="lesson-header__author-meta">
              <Clock size={14} />
              <span>{publishedAt}</span>
              <span className="lesson-header__separator">•</span>
              <Eye size={14} />
              <span>{(viewCount / 1000).toFixed(1)}K lượt xem</span>
            </div>
            <button
              className={`lesson-header__follow-btn ${
                following ? 'lesson-header__follow-btn--following' : ''
              }`}
              onClick={onFollow && artisanId != null ? handleFollow : () => setFollowing(!following)}
              disabled={busy}
            >
              {following ? 'Đang theo dõi' : '+ Theo dõi'}
            </button>
          </div>
        </div>
        <div className="lesson-header__actions">
          <button
            className={`lesson-header__action-btn ${
              liked ? 'lesson-header__action-btn--active' : ''
            }`}
            onClick={onLike && lessonId != null ? handleLike : () => setLiked(!liked)}
            disabled={busy}
            aria-label="Thích"
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span>Thích</span>
          </button>
          <button
            className={`lesson-header__action-btn ${
              saved ? 'lesson-header__action-btn--active' : ''
            }`}
            onClick={onSave && lessonId != null ? handleSave : () => setSaved(!saved)}
            disabled={busy}
            aria-label="Lưu để xem sau"
          >
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
            <span>Lưu để xem sau</span>
          </button>
          <button className="lesson-header__action-btn" aria-label="Chia sẻ">
            <Share2 size={20} />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
