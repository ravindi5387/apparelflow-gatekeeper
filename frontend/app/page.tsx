"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, clearToken, getToken, saveToken } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

type Role = "CUTTING_SUPERVISOR" | "CUTTING_VERIFIER" | "SEWING_SUPERVISOR";
type User = { id: number; email: string; role: Role; fullName: string };
type Component = {
  id: number;
  componentName: string;
  piecesPerGarment: number;
};
type Recipe = {
  id: number;
  recipeCode: string;
  name: string;
  category: string;
  stdFabricYards: number;
  wastageCap: number;
  components: Component[];
};
type VerificationItem = {
  id: number;
  componentId: number;
  expectedQty: number;
  actualQty: number;
  status: "GREEN" | "YELLOW" | "RED";
  component: Component;
};
type Order = {
  id: number;
  orderNo: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: string;
  recipe: Recipe;
  verificationItems: VerificationItem[];
  verificationLogs?: Array<{
    verifier: { fullName: string; email: string };
    timestamp: string;
    decision: string;
    wastagePct: number;
    rejectionNote?: string | null;
  }>;
};

const roleMeta: Record<
  Role,
  { title: string; subtitle: string; accent: string }
> = {
  CUTTING_SUPERVISOR: {
    title: "Cutting Operations",
    subtitle: "Production control",
    accent: "blue",
  },
  CUTTING_VERIFIER: {
    title: "Quality Gate",
    subtitle: "Verification terminal",
    accent: "amber",
  },
  SEWING_SUPERVISOR: {
    title: "Sewing Floor",
    subtitle: "Assembly queue",
    accent: "green",
  },
};

function Icon({
  name,
}: {
  name:
    | "grid"
    | "plus"
    | "clipboard"
    | "shield"
    | "scissors"
    | "sewing"
    | "logout"
    | "check"
    | "alert"
    | "clock"
    | "package"
    | "arrow";
}) {
  const paths: Record<string, React.ReactElement> = { {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8 10h8M8 14h8M8 18h5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.7-3 8.2-7 10-4-1.8-7-5.3-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="7" r="2.5" />
        <circle cx="6" cy="17" r="2.5" />
        <path d="M8.2 8.4L19 18M8.2 15.6L19 6" />
      </>
    ),
    sewing: (
      <>
        <path d="M5 19c4-7 7-11 14-14M5 5c4 7 7 11 14 14" />
        <circle cx="5" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5M15 8l4 4-4 4M19 12H9" />
      </>
    ),
    check: <path d="M5 12l4 4L19 6" />,
    alert: (
      <>
        <path d="M12 4l9 16H3L12 4z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    package: (
      <>
        <path d="M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8M12 12v8" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h13M13 7l5 5-5 5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<Role | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");

  function navigateTo(section: string) {
    setActiveNav(section);
    const target = document.getElementById(`section-${section}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (!getToken()) return;
    api<{ user: User }>("/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => clearToken());
  }, []);

  async function login(
    email = loginEmail,
    password = loginPassword,
    selectedRole = loginRole,
  ) {
    try {
      setError("");
      setMessage("");

      if (!selectedRole) {
        throw new Error("Please select your access role.");
      }

      const result = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // The backend is the source of truth for the authenticated role.
      // Check the selected role against the role returned by the server.
      if (result.user.role !== selectedRole) {
        clearToken();
        throw new Error(
          "The selected role does not match this account. Please choose the correct role.",
        );
      }

      saveToken(result.token);
      setUser(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setMessage("");
    setError("");
  }

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <section className="auth-hero">
            <div className="brand-lockup">
              <div className="brand-mark">AF</div>
              <div>
                <div className="brand-name">ApparelFlow</div>
                <div className="brand-product">Gatekeeper Terminal</div>
              </div>
            </div>
            <div className="hero-copy">
              <div className="eyebrow">PRODUCTION CONTROL · QUALITY GATE</div>
              <h1>Protect every batch before it reaches the sewing floor.</h1>
              <p>
                Production batch verification, role isolation and
                server-enforced release controls for garment manufacturing
                operations.
              </p>
            </div>
            <div className="hero-points">
              <div>
                <span className="point-icon">
                  <Icon name="shield" />
                </span>
                <div>
                  <strong>Server-side gatekeeping</strong>
                  <span>Shortage batches cannot bypass QC.</span>
                </div>
              </div>
              <div>
                <span className="point-icon">
                  <Icon name="clipboard" />
                </span>
                <div>
                  <strong>Persistent audit trail</strong>
                  <span>
                    Verification decisions stay attached to each batch.
                  </span>
                </div>
              </div>
              <div>
                <span className="point-icon">
                  <Icon name="sewing" />
                </span>
                <div>
                  <strong>Verified-only sewing queue</strong>
                  <span>Assembly sees only released production.</span>
                </div>
              </div>
            </div>
            <div className="hero-footer">
              <span>WEBTEZZA · PRACTICAL ENGINEERING CHALLENGE</span>
              <span>v1.0 · Production Gate</span>
            </div>
          </section>

          <section className="auth-panel">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">SECURE ACCESS</div>
                <h2>Sign in to workspace</h2>
                <p>Enter your authorised ApparelFlow account credentials.</p>
              </div>
              <div className="status-dot">
                <span /> System ready
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login();
              }}
              className="login-form"
            >
              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="name@company.com"
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="field">
                <label htmlFor="login-role">Access role</label>
                <select
                  id="login-role"
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as Role | "")}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="CUTTING_SUPERVISOR">Cutting Supervisor</option>
                  <option value="CUTTING_VERIFIER">Cutting Verifier</option>
                  <option value="SEWING_SUPERVISOR">Sewing Supervisor</option>
                </select>
              </div>

              {error && (
                <div className="alert alert-danger">
                  <Icon name="alert" />
                  <span>{error}</span>
                </div>
              )}
              <button className="primary-btn full" type="submit">
                Sign in <Icon name="arrow" />
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const meta = roleMeta[user.role];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small-mark">AF</div>
          <div>
            <strong>ApparelFlow</strong>
            <span>Gatekeeper</span>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="role-card">
          <div className={`role-avatar ${meta.accent}`}>
            {user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <strong>{user.fullName}</strong>
            <span>{meta.subtitle}</span>
          </div>
        </div>
        <nav className="nav-list">
          <div className="nav-caption">OPERATIONS</div>
          <button
            type="button"
            className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("dashboard")}
          >
            <Icon name="grid" />
            <span>{meta.title}</span>
          </button>
          {user.role === "CUTTING_SUPERVISOR" && (
            <>
              <button
                type="button"
                className={`nav-item ${activeNav === "create" ? "active" : ""}`}
                onClick={() => navigateTo("create")}
              >
                <Icon name="plus" />
                <span>Create batch</span>
              </button>
              <button
                type="button"
                className={`nav-item ${activeNav === "orders" ? "active" : ""}`}
                onClick={() => navigateTo("orders")}
              >
                <Icon name="clipboard" />
                <span>Production orders</span>
              </button>
            </>
          )}
          {user.role === "CUTTING_VERIFIER" && (
            <>
              <button
                type="button"
                className={`nav-item ${activeNav === "verification" ? "active" : ""}`}
                onClick={() => navigateTo("verification")}
              >
                <Icon name="shield" />
                <span>Verification terminal</span>
              </button>
              <button
                type="button"
                className={`nav-item ${activeNav === "audit" ? "active" : ""}`}
                onClick={() => navigateTo("audit")}
              >
                <Icon name="clipboard" />
                <span>QC audit</span>
              </button>
            </>
          )}
          {user.role === "SEWING_SUPERVISOR" && (
            <>
              <button
                type="button"
                className={`nav-item ${activeNav === "queue" ? "active" : ""}`}
                onClick={() => navigateTo("queue")}
              >
                <Icon name="sewing" />
                <span>Sewing queue</span>
              </button>
              <button
                type="button"
                className={`nav-item ${activeNav === "released" ? "active" : ""}`}
                onClick={() => navigateTo("released")}
              >
                <Icon name="package" />
                <span>Released batches</span>
              </button>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-chip">
            <span /> Authenticated session
          </div>
          <button className="logout-btn" onClick={logout}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <div className="breadcrumb">
              APPARELFLOW <span>/</span> {meta.title.toUpperCase()}
            </div>
            <h1>{meta.title}</h1>
            <p>
              {meta.subtitle} · {user.email}
            </p>
          </div>
          <div className="header-actions">
            <span className="live-pill">
              <span /> API connected
            </span>
            <div className="user-chip">
              <span>
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              {user.fullName}
            </div>
          </div>
        </header>
        <div className="workspace-content">
          {error && (
            <div className="alert alert-danger page-alert">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="alert alert-success page-alert">
              <Icon name="check" />
              <span>{message}</span>
            </div>
          )}
          {user.role === "CUTTING_SUPERVISOR" && (
            <SupervisorView setError={setError} setMessage={setMessage} />
          )}
          {user.role === "CUTTING_VERIFIER" && (
            <VerifierView setError={setError} setMessage={setMessage} />
          )}
          {user.role === "SEWING_SUPERVISOR" && (
            <SewingView setError={setError} setMessage={setMessage} />
          )}
        </div>
      </main>
    </div>
  );
}

function SupervisorView({
  setError,
  setMessage,
}: {
  setError: (s: string) => void;
  setMessage: (s: string) => void;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [fabricRollId, setFabricRollId] = useState("");
  const [actualFabricYds, setActualFabricYds] = useState("");
  async function load() {
    try {
      const [r, o] = await Promise.all([
        api<Recipe[]>("/recipes"),
        api<Order[]>("/orders"),
      ]);
      setRecipes(r);
      setOrders(o);
      if (!recipeId && r[0]) setRecipeId(String(r[0].id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load workspace.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  const selected = recipes.find((r) => r.id === Number(recipeId));
  const qty = Number(targetQty);
  const expectedFabric =
    selected && qty > 0 ? selected.stdFabricYards * qty : 0;
  const wastage =
    expectedFabric > 0
      ? ((Number(actualFabricYds) - expectedFabric) / expectedFabric) * 100
      : 0;
  async function createOrder(e: FormEvent) {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      if (!Number.isInteger(qty) || qty <= 0)
        throw new Error("Batch quantity must be a positive whole number.");
      if (
        !Number.isFinite(Number(actualFabricYds)) ||
        Number(actualFabricYds) < 0
      )
        throw new Error("Fabric used must be zero or greater.");
      if (!fabricRollId.trim()) throw new Error("Fabric Roll ID is required.");
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          recipeId: Number(recipeId),
          targetQty: qty,
          fabricRollId,
          actualFabricYds: Number(actualFabricYds),
        }),
      });
      setTargetQty("");
      setFabricRollId("");
      setActualFabricYds("");
      setMessage(
        "Production batch created and released to Pending Verification.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create order.");
    }
  }
  const pending = orders.filter(
      (o) => o.status === "PENDING_VERIFICATION",
    ).length,
    verified = orders.filter((o) => o.status === "VERIFIED").length,
    sewing = orders.filter((o) => o.status === "SEWING_IN_PROGRESS").length;
  return (
    <>
      <div id="section-dashboard" className="stat-grid">
        <Stat
          icon="clipboard"
          label="Total batches"
          value={orders.length}
          tone="blue"
        />
        <Stat icon="clock" label="Pending QC" value={pending} tone="amber" />
        <Stat icon="check" label="Verified" value={verified} tone="green" />
        <Stat icon="sewing" label="In sewing" value={sewing} tone="slate" />
      </div>
      <div className="section-grid">
        <section className="panel-card form-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">NEW PRODUCTION BATCH</span>
              <h2>Create cutting order</h2>
              <p>Define the garment recipe, batch quantity and fabric usage.</p>
            </div>
            <span className="secure-label">
              <Icon name="shield" /> Supervisor only
            </span>
          </div>
          <form onSubmit={createOrder} className="form-grid">
            <div className="field span-2">
              <label>Production recipe</label>
              <select
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.recipeCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target batch quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
                placeholder="50"
              />
              <small>Whole units only</small>
            </div>
            <div className="field">
              <label>Fabric roll ID</label>
              <input
                value={fabricRollId}
                onChange={(e) => setFabricRollId(e.target.value)}
                placeholder="FAB-ROLL-882"
              />
            </div>
            <div className="field span-2">
              <label>
                Actual fabric used <span className="unit">yards</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualFabricYds}
                onChange={(e) => setActualFabricYds(e.target.value)}
                placeholder="90.00"
              />
            </div>
            {selected && qty > 0 && (
              <div className="recipe-preview span-2">
                <div className="preview-head">
                  <div>
                    <span className="mini-code">{selected.recipeCode}</span>
                    <strong>{selected.name}</strong>
                  </div>
                  <span>{selected.category}</span>
                </div>
                <div className="component-list">
                  {selected.components.map((c) => (
                    <div className="component-row" key={c.id}>
                      <span>{c.componentName}</span>
                      <strong>{qty * c.piecesPerGarment} pcs</strong>
                    </div>
                  ))}
                </div>
                <div className="fabric-summary">
                  <div>
                    <span>Expected fabric</span>
                    <strong>{expectedFabric.toFixed(2)} yds</strong>
                  </div>
                  <div>
                    <span>Wastage</span>
                    <strong
                      className={
                        wastage > selected.wastageCap
                          ? "text-danger"
                          : "text-green"
                      }
                    >
                      {wastage.toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    <span>Cap</span>
                    <strong>{selected.wastageCap.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            )}
            <div className="span-2">
              <button className="primary-btn" type="submit">
                Create production batch <Icon name="arrow" />
              </button>
            </div>
          </form>
        </section>
        <section className="panel-card">
          <div className="panel-title">
            <div>
              <span className="section-kicker">LIVE PRODUCTION</span>
              <h2>Recent batches</h2>
              <p>Your created orders and their current gate status.</p>
            </div>
          </div>
          <OrderTable orders={orders} />
        </section>
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: "clipboard" | "clock" | "check" | "sewing" | "shield" | "alert";
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Recipe</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <Empty
                  title="No batches yet"
                  text="Create your first production batch to start the gate workflow."
                />
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.orderNo}</strong>
                  <small>{o.fabricRollId}</small>
                </td>
                <td>
                  {o.recipe.name}
                  <small>{o.recipe.recipeCode}</small>
                </td>
                <td>{o.targetQty} units</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function VerifierView({
  setError,
  setMessage,
}: {
  setError: (s: string) => void;
  setMessage: (s: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");
  async function load() {
    try {
      const data = await api<Order[]>("/verifications/pending");
      setOrders(data);
      if (selectedId && !data.some((o) => o.id === selectedId))
        setSelectedId(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load pending batches.",
      );
    }
  }
  useEffect(() => {
    load();
  }, []);
  const selected = orders.find((o) => o.id === selectedId);
  const statuses = useMemo(
    () =>
      !selected
        ? []
        : selected.verificationItems.map((item) => {
            const raw = counts[item.componentId];
            const actual = raw === undefined ? item.actualQty : Number(raw);
            const status =
              actual === item.expectedQty
                ? "GREEN"
                : actual > item.expectedQty
                  ? "YELLOW"
                  : "RED";
            return { ...item, actual, status };
          }),
    [selected, counts],
  );
  const hasRed = statuses.some((i) => i.status === "RED"),
    uncounted = statuses.some(
      (i) => counts[i.componentId] === undefined && i.actualQty === 0,
    ),
    canApprove = Boolean(selected && statuses.length && !hasRed && !uncounted);
  async function saveCounts() {
    if (!selected) return;
    await api(`/verifications/${selected.id}/counts`, {
      method: "POST",
      body: JSON.stringify({
        counts: statuses.map((s) => ({
          componentId: s.componentId,
          actualQty: s.actual,
        })),
      }),
    });
  }
  async function approve() {
    if (!selected) return;
    try {
      setError("");
      setMessage("");
      await saveCounts();
      await api(`/verifications/${selected.id}/approve`, {
        method: "POST",
        body: "{}",
      });
      setMessage("Batch verified and released to the Sewing Queue.");
      setSelectedId(null);
      setCounts({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed.");
    }
  }
  async function reject() {
    if (!selected) return;
    if (!reason.trim()) {
      setError("A rejection reason is mandatory.");
      return;
    }
    try {
      await saveCounts();
      await api(`/verifications/${selected.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionNote: reason }),
      });
      setMessage("Batch rejected and returned for re-cutting.");
      setReason("");
      setSelectedId(null);
      setCounts({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed.");
    }
  }
  return (
    <>
      <div id="section-verification" className="stat-grid">
        <Stat
          icon="clock"
          label="Awaiting QC"
          value={orders.length}
          tone="amber"
        />
        <Stat
          icon="shield"
          label="Gate status"
          value={hasRed ? 0 : 1}
          tone={hasRed ? "red" : "green"}
        />
        <Stat
          icon="check"
          label="Components checked"
          value={statuses.filter((s) => s.actual > 0).length}
          tone="blue"
        />
        <Stat
          icon="alert"
          label="Shortages"
          value={statuses.filter((s) => s.status === "RED").length}
          tone="red"
        />
      </div>
      <div className="qc-layout">
        <section className="panel-card queue-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">QC QUEUE</span>
              <h2>Pending batches</h2>
            </div>
            <span className="count-chip">{orders.length} waiting</span>
          </div>
          {orders.length === 0 ? (
            <Empty
              title="QC queue is clear"
              text="No production batches are waiting for verification."
            />
          ) : (
            <div className="queue-list">
              {orders.map((o) => (
                <button
                  key={o.id}
                  className={`queue-item ${selectedId === o.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedId(o.id);
                    setCounts({});
                    setReason("");
                  }}
                >
                  <span className="queue-number">
                    {o.orderNo.replace("ORD-", "")}
                  </span>
                  <span>
                    <strong>{o.recipe.name}</strong>
                    <small>
                      Qty {o.targetQty} · {o.fabricRollId}
                    </small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="panel-card verification-panel">
          <div className="panel-title">
            <div>
              <span className="section-kicker">VERIFICATION TERMINAL</span>
              <h2>{selected ? selected.orderNo : "Select a batch"}</h2>
              <p>
                {selected
                  ? `${selected.recipe.name} · Count every physical component before release.`
                  : "Choose a pending batch from the QC queue."}
              </p>
            </div>
            {selected && (
              <span className="gate-badge">
                <span /> GATE ACTIVE
              </span>
            )}
          </div>
          {!selected ? (
            <Empty
              title="Ready for inspection"
              text="Select a batch to open the component count terminal."
            />
          ) : (
            <>
              <div className={`hard-stop-banner ${hasRed ? "danger" : "safe"}`}>
                <div className="traffic-light">
                  <span className={!hasRed ? "on-green" : ""} />
                  <span className="on-yellow" />
                  <span className={hasRed ? "on-red" : ""} />
                </div>
                <div>
                  <strong>
                    {hasRed
                      ? "Approval blocked — shortage detected"
                      : "Gatekeeper ready for verification"}
                  </strong>
                  <small>
                    {hasRed
                      ? "One or more components are below the expected quantity."
                      : "All components must be counted before approval."}
                  </small>
                </div>
              </div>
              <div className="data-table-wrap">
                <table className="data-table qc-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Expected</th>
                      <th>Actual pieces</th>
                      <th>Gate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statuses.map((item) => (
                      <tr key={item.componentId}>
                        <td>
                          <strong>{item.component.componentName}</strong>
                          <small>
                            {item.component.piecesPerGarment} pcs / garment
                          </small>
                        </td>
                        <td>{item.expectedQty}</td>
                        <td>
                          <input
                            className="count-input"
                            type="number"
                            min="0"
                            step="1"
                            value={counts[item.componentId] ?? ""}
                            onChange={(e) =>
                              setCounts((prev) => ({
                                ...prev,
                                [item.componentId]: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rejection-box">
                <label>
                  Rejection reason <span>Required when rejecting</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the shortage, defect or count variance..."
                />
              </div>
              <div className="verification-actions">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    saveCounts()
                      .then(() => setMessage("Physical counts saved."))
                      .catch((e) =>
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Unable to save counts.",
                        ),
                      )
                  }
                >
                  Save counts
                </button>
                <button className="danger-btn" onClick={reject}>
                  <Icon name="alert" /> Reject batch
                </button>
                <button
                  className="success-btn"
                  disabled={!canApprove}
                  onClick={approve}
                >
                  <Icon name="check" /> Approve & release
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function SewingView({
  setError,
  setMessage,
}: {
  setError: (s: string) => void;
  setMessage: (s: string) => void;
}) {
  const [queue, setQueue] = useState<Order[]>([]);
  async function load() {
    try {
      setQueue(await api<Order[]>("/sewing/queue"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Sewing Queue.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function start(id: number) {
    try {
      await api(`/sewing/${id}/start`, { method: "POST", body: "{}" });
      setMessage("Sewing assembly started.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start sewing.");
    }
  }
  return (
    <>
      <div id="section-queue" className="stat-grid">
        <Stat
          icon="sewing"
          label="Ready for sewing"
          value={queue.length}
          tone="green"
        />
        <Stat icon="shield" label="Release rule" value={1} tone="blue" />
        <Stat
          icon="check"
          label="Verified only"
          value={queue.length}
          tone="green"
        />
        <Stat
          icon="clock"
          label="Queue state"
          value={queue.length ? 1 : 0}
          tone="slate"
        />
      </div>
      <section className="panel-card">
        <div className="panel-title">
          <div>
            <span className="section-kicker">ASSEMBLY FLOOR</span>
            <h2>Sewing Queue</h2>
            <p>
              Only server-verified batches are released to the sewing floor.
            </p>
          </div>
          <span className="gate-badge green">
            <span /> VERIFIED-ONLY
          </span>
        </div>
        {queue.length === 0 ? (
          <Empty
            title="Queue is clear"
            text="No verified batches are waiting for sewing assembly."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Production batch</th>
                  <th>Recipe</th>
                  <th>Quantity</th>
                  <th>Verifier</th>
                  <th>Wastage</th>
                  <th>Release</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((o) => {
                  const log = o.verificationLogs?.[0];
                  return (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.orderNo}</strong>
                        <small>{o.fabricRollId}</small>
                      </td>
                      <td>
                        {o.recipe.name}
                        <small>{o.recipe.recipeCode}</small>
                      </td>
                      <td>{o.targetQty} units</td>
                      <td>{log?.verifier.fullName ?? "—"}</td>
                      <td>{log ? `${log.wastagePct.toFixed(2)}%` : "—"}</td>
                      <td>
                        <button
                          className="success-btn compact"
                          onClick={() => start(o.id)}
                        >
                          Start sewing <Icon name="arrow" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="clipboard" />
      </div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
