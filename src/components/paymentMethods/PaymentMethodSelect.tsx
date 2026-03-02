import { CreditCard, Smartphone, Banknote, Shield, ExternalLink, MousePointerClick, ArrowRightLeft, Landmark, TicketCheck, QrCode, CheckCircle, Clock } from 'lucide-react';
import type { PaymentMethod } from '../../services/paymentApi';
import '../../styles/components/paymentMethodscss/_payment-method-select.scss';

interface PaymentMethodSelectProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const METHODS: {
  key: PaymentMethod;
  icon: React.ReactNode;
  label: string;
}[] = [
  {
    key: 'VNPAY',
    icon: <CreditCard size={20} />,
    label: 'VNPay - Thanh toán trực tuyến',
  },
  {
    key: 'MOMO',
    icon: <Smartphone size={20} />,
    label: 'Momo/Ví điện tử',
  },
  {
    key: 'CASH',
    icon: <Banknote size={20} />,
    label: 'Tiền mặt - Trả tại điểm hẹn',
  },
];

function VnpayInfo() {
  return (
    <div className="payment-method-info">
      <div className="payment-method-info__header">
        <Shield size={18} className="payment-method-info__shield" />
        <span>Thanh toán an toàn qua cổng VNPay</span>
      </div>
      <p className="payment-method-info__desc">
        Bạn sẽ được chuyển hướng đến trang thanh toán bảo mật của <strong>VNPay</strong> để
        hoàn tất giao dịch. Hỗ trợ thẻ ATM nội địa, Visa, MasterCard, JCB và QR Code.
      </p>
      <div className="payment-method-info__steps">
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon">
            <MousePointerClick size={15} />
          </span>
          <span>Nhấn <strong>"Thanh toán"</strong></span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon">
            <ArrowRightLeft size={15} />
          </span>
          <span>Chuyển hướng đến VNPay</span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon">
            <Landmark size={15} />
          </span>
          <span>Chọn ngân hàng &amp; xác nhận</span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon">
            <TicketCheck size={15} />
          </span>
          <span>Quay lại nhận e-ticket</span>
        </div>
      </div>
      <div className="payment-method-info__badges">
        <span className="payment-method-info__badge">Visa</span>
        <span className="payment-method-info__badge">MasterCard</span>
        <span className="payment-method-info__badge">JCB</span>
        <span className="payment-method-info__badge">ATM nội địa</span>
        <span className="payment-method-info__badge">QR Pay</span>
      </div>
      <div className="payment-method-info__note">
        <ExternalLink size={14} />
        <span>Bạn sẽ được chuyển đến trang VNPay sau khi nhấn thanh toán</span>
      </div>
    </div>
  );
}

function MomoInfo() {
  return (
    <div className="payment-method-info">
      <div className="payment-method-info__header payment-method-info__header--momo">
        <Smartphone size={18} />
        <span>Thanh toán qua ví MoMo</span>
      </div>
      <p className="payment-method-info__desc">
        Bạn sẽ được chuyển hướng đến trang thanh toán của <strong>MoMo</strong>. Quét mã QR
        hoặc xác nhận trên ứng dụng MoMo để hoàn tất thanh toán.
      </p>
      <div className="payment-method-info__steps">
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--momo">
            <MousePointerClick size={15} />
          </span>
          <span>Nhấn <strong>"Thanh toán"</strong></span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--momo">
            <ArrowRightLeft size={15} />
          </span>
          <span>Chuyển hướng đến MoMo</span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--momo">
            <QrCode size={15} />
          </span>
          <span>Quét QR / xác nhận trên app</span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--momo">
            <TicketCheck size={15} />
          </span>
          <span>Quay lại nhận e-ticket</span>
        </div>
      </div>
      <div className="payment-method-info__note payment-method-info__note--momo">
        <ExternalLink size={14} />
        <span>Bạn sẽ được chuyển đến trang MoMo sau khi nhấn thanh toán</span>
      </div>
    </div>
  );
}

function CashInfo() {
  return (
    <div className="payment-method-info">
      <div className="payment-method-info__header payment-method-info__header--cash">
        <Banknote size={18} />
        <span>Thanh toán tiền mặt tại điểm hẹn</span>
      </div>
      <p className="payment-method-info__desc">
        Bạn sẽ thanh toán trực tiếp bằng tiền mặt tại điểm hẹn khởi hành tour.
        Vui lòng đến đúng giờ và mang theo đủ số tiền.
      </p>
      <div className="payment-method-info__steps">
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--cash">
            <CheckCircle size={15} />
          </span>
          <span>Xác nhận đặt chỗ</span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--cash">
            <Clock size={15} />
          </span>
          <span>Giữ chỗ trong <strong>24 giờ</strong></span>
        </div>
        <div className="payment-method-info__step">
          <span className="payment-method-info__step-icon payment-method-info__step-icon--cash">
            <Banknote size={15} />
          </span>
          <span>Thanh toán tiền mặt tại điểm hẹn</span>
        </div>
      </div>
      <div className="payment-method-info__note payment-method-info__note--cash">
        <Shield size={14} />
        <span>Đặt chỗ sẽ được giữ trong 24 giờ. Nếu không thanh toán, đơn sẽ tự động huỷ.</span>
      </div>
    </div>
  );
}

export default function PaymentMethodSelect({
  selected,
  onSelect,
}: PaymentMethodSelectProps) {
  return (
    <div className="payment-method-select">
      {METHODS.map((method) => {
        const isActive = selected === method.key;
        return (
          <div
            key={method.key}
            className={`payment-method-select__option ${
              isActive ? 'payment-method-select__option--active' : ''
            }`}
          >
            <label className="payment-method-select__label">
              <input
                type="radio"
                name="paymentMethod"
                className="payment-method-select__radio"
                checked={isActive}
                onChange={() => onSelect(method.key)}
              />
              <span className="payment-method-select__icon">{method.icon}</span>
              <span className="payment-method-select__text">{method.label}</span>
            </label>

            {/* Expanded info panels */}
            {method.key === 'VNPAY' && isActive && (
              <div className="payment-method-select__expand">
                <VnpayInfo />
              </div>
            )}
            {method.key === 'MOMO' && isActive && (
              <div className="payment-method-select__expand">
                <MomoInfo />
              </div>
            )}
            {method.key === 'CASH' && isActive && (
              <div className="payment-method-select__expand">
                <CashInfo />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
