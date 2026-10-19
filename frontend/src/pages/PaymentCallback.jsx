import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatPrice } from "../api";
import { getToken } from "../auth";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const orderId = params.get("order");
  const [state, setState] = useState({ loading: true, error: "", payment: null, order: null, wallet: null, message: "" });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: "Sign in to finish checking this payment.", payment: null, order: null, wallet: null, message: "" });
      return;
    }
    if (!reference && !orderId) {
      setState({ loading: false, error: "This page needs a payment reference.", payment: null, order: null, wallet: null, message: "" });
      return;
    }

    let ignore = false;
    const request = reference
      ? api("/api/v1/payments/verify", { method: "POST", token, body: { reference } })
      : api(`/api/v1/orders/${orderId}`, { token }).then((data) => ({
          order: data.order,
          payment: null,
          wallet: null,
          message:
            data.order.status === "paid"
              ? "Payment received. Those items are now set aside for you."
              : data.order.status === "paid_unfulfilled"
                ? "We received the money, but an item sold out before we could reserve it."
                : "We found your order.",
        }));

    request
      .then((data) => {
        if (!ignore) setState({ loading: false, error: "", ...data });
      })
      .catch((error) => {
        if (!ignore) {
          setState({ loading: false, error: error.message, payment: null, order: null, wallet: null, message: "" });
        }
      });

    return () => {
      ignore = true;
    };
  }, [reference, orderId]);

  const next = `/payments/callback?${params.toString()}`;
  const order = state.order;
  const unfulfilled = order?.status === "paid_unfulfilled";
  const paid =
    order?.status === "paid" ||
    (state.payment?.purpose === "wallet_topup" && state.payment?.status === "success");
  const title = state.loading
    ? "Checking with Paystack…"
    : unfulfilled
      ? "Money received, item sold out"
      : paid
        ? "Payment received"
        : "Payment update";

  return (
    <section className="panel glass page">
      <p className="eyebrow mono">Payment</p>
      <h1 className="title">{title}</h1>
      {state.loading ? <p className="muted">We do not trust the redirect by itself. The shop is asking Paystack what really happened.</p> : null}
      {state.error ? <p className="error">{state.error}</p> : null}
      {state.message ? <p className="muted">{state.message}</p> : null}
      {state.wallet ? <p className="mono">Wallet balance {formatPrice(state.wallet.balanceKobo)}</p> : null}
      {order ? (
        <div className="callback-order">
          <p className="mono">{order.orderNumber}</p>
          <ul>
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.name}`}>
                {item.quantity} × {item.name}
                <span>{formatPrice(item.unitPriceKobo * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mono">Total {formatPrice(order.totalKobo)}</p>
        </div>
      ) : null}
      <div className="hero-actions">
        {!getToken() ? (
          <Link className="button" to={`/login?next=${encodeURIComponent(next)}`}>
            Sign in
          </Link>
        ) : null}
        <Link className="button" to={state.payment?.purpose === "wallet_topup" ? "/wallet" : "/shop"}>
          {state.payment?.purpose === "wallet_topup" ? "Back to wallet" : "Continue shopping"}
        </Link>
        <Link className="button ghost" to="/cart">
          Cart
        </Link>
      </div>
    </section>
  );
}
