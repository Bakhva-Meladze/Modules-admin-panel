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

    const app = user.app_user;

    return (
      <div>
        <div className="page-header">
          <h2>{user.username}</h2>
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

        <div className="detail-card">
          <dl>
            <dt>{t("userDetail.registrationId")}</dt>
            <dd>{user.id}</dd>
            <dt>{t("col.username")}</dt>
            <dd>{user.username}</dd>
            <dt>{t("col.email")}</dt>
            <dd>{user.email}</dd>
          </dl>
        </div>

        <h3 style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>{t("userDetail.appUserRow")}</h3>
        <div className="detail-card" style={{ marginTop: "0.5rem" }}>
          {app ? (
            <dl>
              <dt>{t("userDetail.usersId")}</dt>
              <dd>{app.id}</dd>
              <dt>{t("userDetail.userIdCol")}</dt>
              <dd>{app.user_id}</dd>
              <dt>{t("userDetail.created")}</dt>
              <dd>{app.created_at || t("common.dash")}</dd>
              <dt>{t("userDetail.updated")}</dt>
              <dd>{app.updated_at || t("common.dash")}</dd>
            </dl>
          ) : (
            <p className="muted">{t("userDetail.noUsersRow")}</p>
          )}
        </div>
      </div>
    );
  }
}
