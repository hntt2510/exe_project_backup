import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLearnCategories, getLearnModules } from "../../../services/api";
import type { LearnCategory, LearnModule } from "../../../types";
import "../../../styles/features/learn/_learn-public.scss";

const EXCLUDED_MODULE_IDS = new Set<number>([1]);

function isAllCategory(cat: LearnCategory): boolean {
  const normalizedName = (cat.name ?? "").trim().toLowerCase();
  const normalizedSlug = (cat.slug ?? "").trim().toLowerCase();
  return normalizedName === "tất cả" || normalizedName === "tat ca" || normalizedSlug === "all";
}

export default function LearnHomePage() {
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [modules, setModules] = useState<LearnModule[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLearnCategories()
      .then((data) =>
        setCategories(
          (data ?? [])
            .filter((cat) => !isAllCategory(cat))
            .sort((a, b) => a.orderIndex - b.orderIndex)
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLearnModules()
      .then((data) => {
        if (!cancelled) {
          setModules((data ?? []).filter((module) => !EXCLUDED_MODULE_IDS.has(module.id)));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được danh sách module.");
          setModules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredModules = useMemo(() => {
    if (activeCategoryId === null) return modules;
    return modules.filter((m) => m.categoryId === activeCategoryId);
  }, [modules, activeCategoryId]);

  const title = useMemo(() => "HỌC NHANH VĂN HÓA TÂY NGUYÊN", []);

  return (
    <div className="learn-public learn-home">
      {/* Section 1: white — header, filters */}
      <section className="learn-section learn-section--white">
        <div className="learn-public__container">
          <header className="learn-home__header">
            <h1 className="learn-home__title">{title}</h1>
            <p className="learn-home__subtitle">
              3 phút/bài - Tìm hiểu văn hóa đặc sắc của vùng đất Tây Nguyên
            </p>
          </header>
          <section className="learn-home__filters" aria-label="Bộ lọc danh mục">
            <button
              type="button"
              className={`learn-chip ${activeCategoryId === null ? "learn-chip--active" : ""}`}
              onClick={() => setActiveCategoryId(null)}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`learn-chip ${activeCategoryId === cat.id ? "learn-chip--active" : ""}`}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </section>
        </div>
      </section>

      {/* Section 2: paper — chỉ 1 lần ở giữa */}
      <section className="learn-section learn-section--paper">
        <div className="learn-public__container">
          <section className="learn-home__promo">
            Học xong nhận Chứng chỉ mini + ưu đãi giảm 5% tour
          </section>
          {loading && <p className="learn-public__state">Đang tải module...</p>}
          {!loading && error && <p className="learn-public__state">{error}</p>}
          {!loading && !error && filteredModules.length === 0 && (
            <p className="learn-public__state">Chưa có bài học nào trong danh mục này.</p>
          )}
          {!loading && filteredModules.length > 0 && (
            <section className="learn-home__grid">
              {filteredModules.map((module) => {
                const lessonCount = module.lessonsCount ?? module.lessons?.length ?? 0;
                const duration = module.durationMinutes ?? 0;
                return (
                  <Link key={module.id} to={`/learn/${module.id}`} className="learn-card">
                    <div className="learn-card__image-wrap">
                      <img
                        src={module.thumbnailUrl || "/nen.png"}
                        alt={module.title}
                        className="learn-card__image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/nen.png";
                        }}
                      />
                      {module.categoryName && (
                        <span className="learn-card__badge">{module.categoryName}</span>
                      )}
                    </div>
                    <div className="learn-card__body">
                      <h3 className="learn-card__title">{module.title}</h3>
                      <p className="learn-card__meta">
                        {lessonCount} bài <span>•</span> {duration} phút
                      </p>
                      <span className="learn-card__cta">Học ngay</span>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
