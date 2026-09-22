import { CreditCard, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import paymentService from "../../services/paymentService";

const PaymentPanel = ({ job, onPaid }) => {
  const [method, setMethod] = useState("upi");
  const [promoCode, setPromoCode] = useState("");
  const [wallet, setWallet] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    paymentService.getWallet().then((data) => setWallet(data.wallet)).catch(() => {});
  }, []);

  const handleTopUp = async () => {
    try {
      setError("");
      const data = await paymentService.topUp(topUpAmount);
      setWallet(data.wallet);
      setMessage("Wallet topped up in sandbox mode.");
    } catch (topUpError) {
      setError(topUpError.message);
    }
  };

  const handlePay = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await paymentService.payJob(job.id, method, promoCode);
      setMessage(`₹${data.payment.grossAmount} held securely in escrow.`);
      onPaid?.(data.job);
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="details-card payment-panel">
      <div className="details-card-header">
        <h2><CreditCard size={19} /> Secure Payment</h2>
        <span>₹{job.finalPrice}</span>
      </div>
      {wallet && <p className="wallet-balance"><WalletCards size={16} /> Wallet balance: ₹{wallet.balance}</p>}
      <div className="payment-methods" role="group" aria-label="Payment method">
        {[["upi", "UPI"], ["card", "Card"], ["wallet", "Wallet"]].map(([value, label]) => (
          <button key={value} type="button" className={method === value ? "payment-method active" : "payment-method"} onClick={() => setMethod(value)}>{label}</button>
        ))}
      </div>
      {method === "wallet" && (
        <div className="wallet-top-up">
          <input type="number" min="1" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} aria-label="Top-up amount" />
          <button type="button" className="secondary-btn" onClick={handleTopUp}>Add funds</button>
        </div>
      )}
      <input className="promo-code-input" placeholder="Promo code (optional)" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} />
      {error && <p className="job-action-message error">{error}</p>}
      {message && <p className="job-action-message success">{message}</p>}
      <button type="button" className="primary-btn full-width" onClick={handlePay} disabled={loading}>{loading ? "Processing..." : "Pay and hold in escrow"}</button>
    </section>
  );
};

export default PaymentPanel;
