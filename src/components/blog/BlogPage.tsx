import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getBlogPosts, getProvinces } from "../../services/api";
import BlogHero from "./BlogHero";
import BlogFilterBar from "./BlogFilterBar";
import BlogGrid from "./BlogGrid";
import type { BlogPost } from "../../types";
import "../../styles/components/blog/_blog-page.scss";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [provinces, setProvinces] = useState<Awaited<ReturnType<typeof getProvinces>>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvinceId, setSelectedProvinceId] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsData, provincesData] = await Promise.all([
          getBlogPosts(),
          getProvinces(),
        ]);
        if (!cancelled) {
          setPosts(postsData ?? []);
          setProvinces(provincesData ?? []);
        }
      } catch (err) {
        console.error("[BlogPage] Failed to fetch:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (selectedProvinceId !== "all") {
      const provinceId = Number(selectedProvinceId);
      const selectedProvince = provinces.find((p) => p.id === provinceId);
      result = result.filter(
        (p) =>
          p.provinceId === provinceId ||
          p.province?.id === provinceId ||
          (selectedProvince && p.provinceName === selectedProvince.name)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [posts, provinces, selectedProvinceId, sortBy]);

  const handleReset = () => {
    setSelectedProvinceId("all");
    setSortBy("newest");
  };

  return (
    <div className="blog-page">
      <BlogHero />
      <section className="blog-page__content">
        <motion.div
          className="blog-page__filter-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BlogFilterBar
            provinces={provinces}
            selectedProvinceId={selectedProvinceId}
            onProvinceChange={setSelectedProvinceId}
            sortBy={sortBy}
            onSortChange={(v) => setSortBy(v as "newest" | "oldest")}
            onReset={handleReset}
            total={filteredPosts.length}
          />
        </motion.div>
        <BlogGrid
          key={`${selectedProvinceId}-${sortBy}`}
          posts={filteredPosts}
          loading={loading}
        />
      </section>
    </div>
  );
}
