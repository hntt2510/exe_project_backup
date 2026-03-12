import { Award, BookOpen, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LearnStats, FeaturedCourse } from '../../services/profileApi';
import '../../styles/components/profile/_profile-learn.scss';

interface ProfileLearnProps {
  stats: LearnStats | null;
}

export default function ProfileLearn({ stats }: ProfileLearnProps) {
  if (!stats) {
    return (
      <div className="profile-learn">
        <h3 className="profile-learn__title">Học & Quiz</h3>
        <div className="profile-learn__empty">
          <BookOpen size={40} />
          <p>Bạn chưa tham gia khoá học nào.</p>
          <Link to="/learn" className="profile-learn__start-btn">
            Bắt đầu học ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-learn">
      <h3 className="profile-learn__title">Học & Quiz</h3>

      {/* Achievement banner */}
      {stats.averageScore >= 100 && stats.featuredCourses.length > 0 && (
        <div className="profile-learn__banner">
          <div className="profile-learn__banner-icon">
            <Award size={32} />
          </div>
          <div className="profile-learn__banner-content">
            <strong>
              Chúc mừng! Bạn đạt 100% quiz ở "{stats.featuredCourses[0]?.title}"
            </strong>
            <p>Voucher tặng: COIVIET-50K (50.000đ)</p>
            <p className="profile-learn__banner-note">
              Áp dụng cho tour nội địa, tối thiểu 500k. Hạn 30 ngày từ ngày nhận
            </p>
          </div>
          <button className="profile-learn__claim-btn">Nhận voucher</button>
        </div>
      )}

      {/* Stats cards */}
      <div className="profile-learn__stats">
        <div className="profile-learn__stat-card">
          <span className="profile-learn__stat-value profile-learn__stat-value--primary">
            {stats.totalLessonsCompleted}
          </span>
          <span className="profile-learn__stat-label">
            <BookOpen size={14} /> Tổng số bài đã học
          </span>
        </div>
        <div className="profile-learn__stat-card">
          <span className="profile-learn__stat-value profile-learn__stat-value--accent">
            {stats.averageScore}%
          </span>
          <span className="profile-learn__stat-label">
            <TrendingUp size={14} /> Điểm trung bình
          </span>
        </div>
        <div className="profile-learn__stat-card">
          <span className="profile-learn__stat-value profile-learn__stat-value--blue">
            {stats.learningStreak}
          </span>
          <span className="profile-learn__stat-label">
            <Flame size={14} /> Streak ngày học
          </span>
        </div>
      </div>

      {/* Featured courses */}
      {stats.featuredCourses.length > 0 && (
        <div className="profile-learn__courses">
          {stats.featuredCourses.map((course: FeaturedCourse) => (
            <Link
              key={course.id}
              to={`/learn/${course.id}`}
              className="profile-learn__course-card"
            >
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="profile-learn__course-img"
              />
              <h4 className="profile-learn__course-title">{course.title}</h4>
              <span className="profile-learn__course-date">
                {course.lessonsCount} bài học
              </span>
              <span className="profile-learn__course-link">
                Xem lại bài giảng <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
