import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import PaginationBar from "../components/PaginationBar.jsx";
import { PAGE_SIZE } from "../constants/pagination.js";
import { LanguageContext } from "../i18n/languageContext.js";

export default class OrdersList extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      page: 1,
      totalPages: 1,
      total: 0,
      limit: PAGE_SIZE,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.load(1);
  }

  load = async (requestedPage) => {
    const page = requestedPage ?? this.state.page;
    this.setState({ loading: true, error: null });
    try {
      const data = await apiGet(`/api/orders?page=${page}&limit=${PAGE_SIZE}`);
      const { items, total, page: resPage, totalPages, limit } = data;
      if (items.length === 0 && resPage > 1) {
        return this.load(resPage - 1);
      }
      this.setState({
        items,
        total,
        page: resPage,
        totalPages,
        limit,
        loading: false,
      });
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
    const { items, page, totalPages, total, limit, loading, error } = this.state;
    const { t } = this.context;

    return (
      <div>
        <div className="page-header">
          <h2>{t("orders.title")}</h2>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <p className="muted">{t("common.loading")}</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t("col.id")}</th>
                    <th>{t("col.username")}</th>
                    <th>{t("col.email")}</th>
                    <th>{t("col.status")}</th>
                    <th>{t("col.total")}</th>
                    <th>{t("col.placedAt")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.username || t("common.dash")}</td>
                      <td>{o.email || t("common.dash")}</td>
                      <td>
                        <span className={`order-status order-status--${String(o.status).replace(/[^a-z]/g, "") || "unknown"}`}>
                          {this.statusLabel(o.status)}
                        </span>
                      </td>
                      <td>{o.total_price}</td>
                      <td className="muted" style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                        {o.created_at
                          ? new Date(o.created_at).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : t("common.dash")}
                      </td>
                      <td>
                        <Link to={`/orders/${o.id}`} className="btn btn-ghost">
                          {t("common.view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(total > 0 || page > 1) && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={(p) => this.load(p)}
                t={t}
              />
            )}
          </>
        )}
      </div>
    );
  }
}
