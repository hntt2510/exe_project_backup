import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    HeroSection,
    LazyMapSection,
    LazySection,
    WhereToNextSection,
    TourExperienceSection,
    QuickLearnSection,
    InspirationSection,
    TestimonialsSection,
    WhyChooseSection,
    LeadFormSection,
} from '../components/home';
import { getHomePageData } from '../services/api';
import type { HomePageResponse } from '../types';

export default function HomePage() {
    const { hash } = useLocation();

    // Chỉ hiển thị dữ liệu từ API
    const [data, setData] = useState<HomePageResponse>({
        provinces: [],
        featuredTours: [],
        cultureItems: [],
        artisans: [],
        blogPosts: [],
        videos: [],
        userMemories: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Scroll tới section Đăng ký tư vấn khi có hash #dang-ky-tu-van
    useEffect(() => {
        if (hash !== '#dang-ky-tu-van') return;
        const scrollToSection = () => {
            const el = document.getElementById('dang-ky-tu-van');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        scrollToSection();
        const t = setTimeout(scrollToSection, 200);
        return () => clearTimeout(t);
    }, [hash]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getHomePageData(10);
                setData({
                    provinces: response?.provinces ?? [],
                    featuredTours: response?.featuredTours ?? [],
                    cultureItems: response?.cultureItems ?? [],
                    artisans: response?.artisans ?? [],
                    blogPosts: response?.blogPosts ?? [],
                    videos: response?.videos ?? [],
                    userMemories: response?.userMemories ?? [],
                });
            } catch (err: unknown) {
                setError('API không khả dụng. Đang hiển thị dữ liệu mẫu.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // LUÔN render giao diện, chỉ thêm warning banner nếu có lỗi
    return (
        <main>
            {/* Warning banner khi API lỗi */}
            {error && (
                <div className="home-warning">
                    <div className="home-warning__inner">
                        <span className="home-warning__icon">⚠️</span>
                        <p className="home-warning__text">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading overlay nhỏ góc màn hình */}
            {loading && (
                <div className="home-loading-toast">
                    <div className="home-loading-toast__spinner" />
                    <span className="home-loading-toast__text">Đang tải...</span>
                </div>
            )}

            <HeroSection />
            <LazyMapSection provinces={data.provinces} />
            <WhereToNextSection provinces={data.provinces} />
            <TourExperienceSection tours={data.featuredTours} />
            <LazySection minHeight={400}>
              <QuickLearnSection blogPosts={data.blogPosts} videos={data.videos} />
            </LazySection>
            <LazySection minHeight={300}>
              <InspirationSection />
            </LazySection>
            <LazySection minHeight={350}>
              <TestimonialsSection />
            </LazySection>
            <LazySection minHeight={350}>
              <WhyChooseSection />
            </LazySection>
            <LazySection id="dang-ky-tu-van" minHeight={450}>
              <LeadFormSection />
            </LazySection>
        </main>
    );
}
