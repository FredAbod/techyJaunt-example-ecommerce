import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice, nairaToKobo } from "../api";
import { getToken } from "../auth";
import { useApp } from "../store";

const MIN_TOPUP_KOBO = 10_000;
const QUICK_KOBO = [100_000, 200_000, 500_000, 1_000_000];

export default function Wallet() {
  const { user, toast } = useApp();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [naira, setNaira] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let ignore = false;
    const token = getToken();
    Promise.all([
      api("/api/v1/wallets", { token }),
      api("/api/v1/wallets/transactions?limit=20", { token }),
    ])
      .then(([walletData, history]) => {
        if (ignore) return;
        setWallet(walletData.wallet);
        setTransactions(history.transactions);
        setNextCursor(history.nextCursor);
      })
      .catch((error) => {
        if (!ignore) toast(error.message, "error");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, toast]);

  if (!user && getToken()) {
    return (
      <section className="panel glass page">
        <p className="muted">Opening your wallet…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="panel glass page">
        <p className="eyebrow mono">Wallet</p>
        <h1 className="title">Sign in to see your wallet.</h1>
        <p className="muted">Money you add stays on your account.</p>
        <Link className="button" to="/login?next=/wallet">
          Sign in
        </Link>
      </section>
    );
  }

  const loadMore = async () => {
    const data = await api(`/api/v1/wallets/transactions?limit=20&cursor=${nextCursor}`, {
      token: getToken(),
    });
    setTransactions((current) => [...current, ...data.transactions]);
    setNextCursor(data.nextCursor);
  };

  const topUp = async (amountKobo) => {
    if (!Number.isInteger(amountKobo) || amountKobo < MIN_TOPUP_KOBO) {
      toast("The smallest top up is ₦100.", "error");
      return;
    }
    setPaying(true);
    try {
      const data = await api("/api/v1/payments/top-up", {
        method: "POST",
        token: getToken(),
        body: { amountKobo },
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      toast(error.message, "error");
      setPaying(false);
    }
  };

  const submitCustom = (event) => {
    event.preventDefault();
    topUp(nairaToKobo(naira));
  };

  return (
    <section className="section page wrap">
      <header className="shop-head">
        <div>
          <p className="eyebrow mono">Wallet</p>
          <h1 className="title">Your naira</h1>
        </div>
      </header>

      {loading ? (
        <p className="muted">Loading your wallet…</p>
      ) : !wallet ? (
        <p className="muted">We could not open your wallet. Refresh the page and try again.</p>
      ) : (
        <div className="wallet-layout">
          <div className="wallet-stack">
            <article className="balance-card glass">
              <p className="eyebrow mono">Balance</p>
              <strong>{formatPrice(wallet.balanceKobo)}</strong>
              <p className="muted mono">Account {wallet.accountNumber}</p>
              <p className="pay-note">
                {wallet.status === "active" ? "Ready to spend." : "This wallet is frozen."}
              </p>
            </article>

            <form className="glass topup-card" onSubmit={submitCustom}>
              <h2>Add money</h2>
              <p className="muted">Paystack takes the payment. We add it only after they confirm it.</p>
              <div className="chip-row">
                {QUICK_KOBO.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="chip"
                    disabled={paying || wallet.status !== "active"}
                    onClick={() => topUp(amount)}
                  >
                    {formatPrice(amount)}
                  </button>
                ))}
              </div>
              <label>
                <span>Other amount, in naira</span>
                <input
                  className="field"
                  inputMode="numeric"
                  value={naira}
                  onChange={(event) => setNaira(event.target.value)}
                  min="100"
                  required
                />
              </label>
              <button className="button grow" type="submit" disabled={paying || wallet.status !== "active"}>
                {paying ? "Opening Paystack…" : "Continue to Paystack"}
              </button>
            </form>
          </div>

          <aside className="glass tx-card">
            <h2>Notebook</h2>
            {transactions.length === 0 ? (
              <p className="muted">No lines yet. A line appears only when the balance changes.</p>
            ) : (
              <ul className="tx-list">
                {transactions.map((entry) => (
                  <li key={entry.id} className="tx-row">
                    <div>
                      <p>{entry.description}</p>
                      <p className="muted mono">
                        {new Date(entry.createdAt).toLocaleString("en-NG")}
                      </p>
                    </div>
                    <strong className={entry.type === "credit" ? "tx-credit" : "tx-debit"}>
                      {entry.type === "credit" ? "+" : "−"}
                      {formatPrice(entry.amountKobo)}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
            {nextCursor ? (
              <button type="button" className="button ghost grow" onClick={() => loadMore().catch((error) => toast(error.message, "error"))}>
                Older lines
              </button>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
}
