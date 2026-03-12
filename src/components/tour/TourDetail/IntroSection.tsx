import { Link } from 'react-router-dom';
import { Calendar, Car, HandHeart, Play } from 'lucide-react';
import type { Tour, CultureItem, Province } from '../../../types';
import { parseImages } from './utils';

interface IntroSectionProps {
  tour: Tour;
  province: Province | null;
  videoItem?: CultureItem;
  introRef: (el: HTMLElement | null) => void;
  videosRef: (el: HTMLElement | null) => void;
}

export default function IntroSection({
  tour,
  province,
  videoItem,
  introRef,
  videosRef,
}: IntroSectionProps) {
  return (
    <>
      {/* GIỚI THIỆU CHUNG */}
      <section className="td-section td-intro" ref={introRef}>
        <div className="td-section__container">
          <h2 className="td-section__title td-section__title--decorated">GIỚI THIỆU CHUNG</h2>
          <div className="td-intro__grid">
            <div className="td-intro__text">
              <p>{tour.description}</p>
              {province && <p>{province.description}</p>}
            </div>
            <div className="td-intro__sidebar">
              <div className="td-quick-info">
                <h3 className="td-quick-info__title">Thông tin nhanh</h3>
                <div className="td-quick-info__item">
                  <Calendar size={16} />
                  <div>
                    <strong>Thời điểm đẹp nhất</strong>
                    <p>
                      {tour.bestSeason ??
                        province?.bestSeason ??
                        'Tháng 10 - Tháng 3 (mùa khô, thời tiết mát mẻ)'}
                    </p>
                  </div>
                </div>
                <div className="td-quick-info__item">
                  <Car size={16} />
                  <div>
                    <strong>Cách di chuyển</strong>
                    <p>
                      {tour.transportation ??
                        province?.transportation ??
                        (province ? `Từ ${province.name}` : 'Liên hệ để biết thêm')}
                    </p>
                  </div>
                </div>
                <div className="td-quick-info__item">
                  <HandHeart size={16} />
                  <div>
                    <strong>Lưu ý văn hoá</strong>
                    <p>
                      {tour.culturalTips ??
                        province?.culturalTips ??
                        'Trang phục lịch sự, tôn trọng phong tục địa phương'}
                    </p>
                  </div>
                </div>
                <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary td-quick-info__cta">
                  Đặt ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="td-section td-video" ref={videosRef}>
        <div className="td-video__wrapper">
          {videoItem?.videoUrl ? (
            <iframe
              className="td-video__player"
              src={videoItem.videoUrl}
              title={videoItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="td-video__placeholder">
              <img
                src={parseImages(tour.images)[1] || tour.thumbnailUrl || '/nen.png'}
                alt="Video placeholder"
              />
              <div className="td-video__play-btn">
                <Play size={48} />
              </div>
            </div>
          )}
        </div>
        <div className="td-video__caption">
          <h3>Một ngày ở {province?.name || tour.title}</h3>
          <p>Trải nghiệm một ngày đầy thú vị khám phá rừng thông, thác nước và văn hoá bản địa</p>
        </div>
      </section>
    </>
  );
}
