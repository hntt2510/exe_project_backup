import { useEffect, useState } from "react";
import { getBlogPosts } from "../../services/api";
import BlogHero from "./BlogHero";
import BlogGrid from "./BlogGrid";
import "../../styles/components/blog/_blog-page.scss";

export default function BlogPage() {
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof getBlogPosts>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await getBlogPosts();
        if (!cancelled) {
          setPosts(data ?? []);
        }
      } catch (err) {
        console.error("[BlogPage] Failed to fetch blog posts:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="blog-page">
      <BlogHero />
      <BlogGrid posts={posts} loading={loading} />
    </div>
  );
}
