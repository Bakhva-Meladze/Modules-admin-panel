import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import { LanguageContext } from "../i18n/languageContext.js";
import { publicImageSrc } from "../utils/imageUrl.js";

export default class OrderDetail extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { order: null, loading: true, error: null };
  }

  componentDidMount() {
    this.fetchOrder();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.router?.params?.id !== this.props.router?.params?.id) {
      this.fetchOrder();
    }
  }

  fetchOrder = async () => {
    const id = this.props.router?.params?.id;
    if (!id) return;
    this.setState({ loading: true, error: null });
    try {
      const order = await apiGet(`/api/orders/${id}`);
      this.setState({ order, loading: false });
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  statusLabel = (status) => {
    const { t } = this.context;
    if (!status || status === "—") return t("orderStatus.unknown");
    const key = `orderStatus.${status}`;
    const label = t(key);
    return label === key ? status : label;
  };

  render() {
    const { order, loading, error } = this.state;
    const id = this.props.router?.params?.id;
    const { t } = this.context;

    if (loading) return <p className="muted">{t("common.loading")}</p>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!order) return <p className="muted">{t("orders.notFound", { id })}</p>;

    const lines = Array.isArray(order.line_items) ? order.line_items : [];

    return (
      <div>
        <div className="page-header">
          <h2>{t("orderDetail.title", { id: order.id })}</h2>
          <Link to="/orders" className="btn btn-ghost">
            {t("common.back")}
          </Link>
        </div>

        <div className="detail-card">
          <dl>
            <dt>{t("col.id")}</dt>
            <dd>{order.id}</dd>
            <dt>{t("orderDetail.status")}</dt>
            <dd>
              <span className={`order-status order-status--${String(order.status).replace(/[^a-z]/g, "") || "unknown"}`}>
                {this.statusLabel(order.status)}
              </span>
            </dd>
            <dt>{t("col.total")}</dt>
            <dd>{order.total_price}</dd>
            <dt>{t("orderDetail.placedAt")}</dt>
            <dd>
              {order.created_at
                ? new Date(order.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : t("common.dash")}
            </dd>
            <dt>{t("orderDetail.updatedAt")}</dt>
            <dd>
              {order.updated_at
                ? new Date(order.updated_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : t("common.dash")}
            </dd>
            <dt>{t("orderDetail.customer")}</dt>
            <dd>
              {order.user_id ? (
                <Link to={`/users/${order.user_id}`}>
                  {order.username || order.email || `#${order.user_id}`}
                </Link>
              ) : (
                t("common.dash")
              )}
              {order.email ? (
                <span className="muted" style={{ display: "block", marginTop: 4, fontSize: "0.9rem" }}>
                  {order.email}
                </span>
              ) : null}
            </dd>
          </dl>
        </div>

        <h3 style={{ marginTop: "1.75rem", fontSize: "1.1rem", fontWeight: 600 }}>{t("orderDetail.lineItems")}</h3>
        <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
          <table className="data">
            <thead>
              <tr>
                <th className="col-thumb">{t("col.image")}</th>
                <th>{t("col.name")}</th>
                <th>{t("col.productId")}</th>
                <th>{t("col.quantity")}</th>
                <th>{t("col.price")}</th>
                <th>{t("col.subtotal")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    {t("orderDetail.noLineItems")}
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => {
                  const qty = Number(line.quantity) || 0;
                  const price = Number(line.price) || 0;
                  const sub = qty * price;
                  const thumb = publicImageSrc(line.image);
                  return (
                    <tr key={`${line.product_id}-${i}`}>
                      <td className="col-thumb">
                        {thumb ? (
                          <img src={thumb} alt="" className="product-list-thumb" loading="lazy" />
                        ) : (
                          <span className="product-list-thumb-placeholder" aria-hidden="true">
                            {t("common.dash")}
                          </span>
                        )}
                      </td>
                      <td>{line.name || t("common.dash")}</td>
                      <td>{line.product_id ?? t("common.dash")}</td>
                      <td>{qty}</td>
                      <td>{price}</td>
                      <td>{sub}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
