import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../api.js";
import { LanguageContext } from "../i18n/languageContext.js";

export default class UserDetail extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { user: null, loading: true, error: null };
  }

  componentDidMount() {
    this.fetchUser();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.router?.params?.id !== this.props.router?.params?.id) {
      this.fetchUser();
    }
  }

  fetchUser = async () => {
    const id = this.props.router?.params?.id;
    if (!id) return;
    this.setState({ loading: true, error: null });
    try {
      const user = await apiGet(`/api/users/${id}`);
      this.setState({ user, loading: false });
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  deleteUser = async () => {
    const { user } = this.state;
    const nav = this.props.router?.navigate;
    const { t } = this.context;
    if (!user || !window.confirm(t("userDetail.deleteConfirm", { name: user.username }))) return;
    try {
      await apiSend("DELETE", `/api/users/${user.id}`);
      nav("/users");
    } catch (e) {
      alert(e.message);
    }
  };

  render() {
    const { user, loading, error } = this.state;
    const id = this.props.router?.params?.id;
    const { t } = this.context;

    if (loading) return <p className="muted">{t("common.loading")}</p>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!user) return <p className="muted">{t("users.notFound", { id })}</p>;
    const orders = Array.isArray(user.orders) ? user.orders : [];

    return (
      <div className="user-detail-page">
        <div className="page-header">
          <div>
            <h2>{user.username}</h2>
            <p className="muted user-detail-lede">
              {user.email || t("common.dash")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link to="/users" className="btn btn-ghost">
              {t("common.back")}
            </Link>
            <Link to={`/users/${user.id}/edit`} className="btn btn-primary">
              {t("common.edit")}
            </Link>
            <button type="button" className="btn btn-danger" onClick={this.deleteUser}>
              {t("common.delete")}
            </button>
          </div>
        </div>

        <div className="user-detail-grid">
          <section className="detail-card user-detail-card">
            <h3 className="user-detail-card-title">{t("userDetail.profile")}</h3>
            <dl>
              <dt>{t("userDetail.registrationId")}</dt>
              <dd>{user.id}</dd>
              <dt>{t("col.username")}</dt>
              <dd>{user.username}</dd>
              <dt>{t("col.email")}</dt>
              <dd>{user.email || t("common.dash")}</dd>
            </dl>
          </section>

          <section className="detail-card user-detail-card">
            <h3 className="user-detail-card-title">{t("userDetail.activity")}</h3>
            <dl>
              <dt>{t("userDetail.usersId")}</dt>
              <dd>{user.id}</dd>
              <dt>{t("userDetail.created")}</dt>
              <dd>{user.created_at || t("common.dash")}</dd>
              <dt>{t("userDetail.updated")}</dt>
              <dd>{user.updated_at || t("common.dash")}</dd>
            </dl>
          </section>
        </div>

        <section className="user-detail-section">
          <div className="user-detail-section-header">
            <div>
              <h3 className="user-detail-card-title">{t("userDetail.orders")}</h3>
              <p className="muted user-detail-section-copy">
                {t("userDetail.ordersDesc", { count: orders.length })}
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="detail-card">
              <p className="muted" style={{ margin: 0 }}>{t("userDetail.noOrders")}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t("col.id")}</th>
                    <th>{t("col.status")}</th>
                    <th>{t("col.total")}</th>
                    <th>{t("col.placedAt")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.status || t("common.dash")}</td>
                      <td>{order.total_price}</td>
                      <td>{order.created_at || t("common.dash")}</td>
                      <td>
                        <Link to={`/orders/${order.id}`} className="btn btn-ghost">
                          {t("common.view")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }
}
