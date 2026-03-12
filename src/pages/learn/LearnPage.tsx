import { useState, useEffect } from 'react';
import { getLearnModules, getLearnCategories, getLearnUserStats } from '../../services/api';
import { LearnPageContent, type LessonGroup } from '../../components/learn';
import type { LearnModule, LearnCategory, LearnUserStats } from '../../types';

function slugify(name: string): string {
  return (name ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'all';
}

function mapModuleToLessonGroup(
  m: LearnModule,
  categoryLookup?: Map<number, string>
): LessonGroup {
  const categoryName =
    m.categoryName ?? (m.categoryId && categoryLookup?.get(m.categoryId)) ?? '';
  const categorySlug = categoryName ? (m.categorySlug ?? slugify(categoryName)) : 'all';
  return {
    id: m.id,
    title: m.title,
    slug: m.slug ?? '',
    category: categoryName,
    categorySlug,
    thumbnailUrl: m.thumbnailUrl ?? '',
    lessonCount: m.lessonsCount ?? m.lessons?.length ?? 0,
    totalDuration: m.durationMinutes ?? 0,
  };
}

function extractCategoriesFromModules(modules: LearnModule[]): LearnCategory[] {
  const byCat = new Map<number, LearnCategory>();
  modules.forEach((m, idx) => {
    if (m.categoryId && m.categoryName && !byCat.has(m.categoryId)) {
      byCat.set(m.categoryId, {
        id: m.categoryId,
        name: m.categoryName,
        slug: m.categorySlug ?? slugify(m.categoryName),
        orderIndex: idx,
      });
    }
  });
  return Array.from(byCat.values()).sort((a, b) => a.orderIndex - b.orderIndex);
}

export default function LearnPage() {
  const [lessonGroups, setLessonGroups] = useState<LessonGroup[]>([]);
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [stats, setStats] = useState<LearnUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Lấy danh mục, modules và thống kê – fetch song song, dùng categories để resolve category name
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getLearnCategories(),
      getLearnModules(activeCategoryId ?? undefined),
      getLearnUserStats(),
    ])
      .then(([cats, mods, statsData]) => {
        if (cancelled) return;
        const categories = (cats ?? []) as LearnCategory[];
        const modules = (mods ?? []) as LearnModule[];
        const categoryLookup = new Map(categories.map((c) => [c.id, c.name]));
        setCategories(categories.length > 0 ? categories : extractCategoriesFromModules(modules));
        setLessonGroups(modules.map((m) => mapModuleToLessonGroup(m, categoryLookup)));
        setStats(statsData ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[LearnPage] API Error:', err);
          setLessonGroups([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategoryId]);

  return (
    <LearnPageContent
      lessonGroups={lessonGroups}
      categories={categories}
      stats={stats}
      loading={loading}
      activeCategoryId={activeCategoryId}
      onCategoryChange={setActiveCategoryId}
    />
  );
}
