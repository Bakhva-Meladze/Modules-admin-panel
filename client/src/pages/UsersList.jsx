import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../api.js";
import PaginationBar from "../components/PaginationBar.jsx";
import { PAGE_SIZE } from "../constants/pagination.js";
import { LanguageContext } from "../i18n/languageContext.js";

export default class UsersList extends Component {
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
      const data = await apiGet(`/api/users?page=${page}&limit=${PAGE_SIZE}`);
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

  deleteUser = async (id, username) => {
    const { t } = this.context;
    if (!window.confirm(t("users.deleteConfirm", { name: username }))) return;
    try {
      await apiSend("DELETE", `/api/users/${id}`);
      await this.load();
    } catch (e) {
      alert(e.message);
    }
  };

  render() {
    const { items, page, totalPages, total, limit, loading, error } = this.state;
    const { t } = this.context;

    return (
      <div>
        <div className="page-header">
          <h2>{t("users.title")}</h2>
          <Link to="/users/new" className="btn btn-primary">
            {t("users.new")}
          </Link>
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
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <Link to={`/users/${u.id}`} className="btn btn-ghost" style={{ marginRight: 8 }}>
                          {t("common.view")}
                        </Link>
                        <Link to={`/users/${u.id}/edit`} className="btn btn-ghost" style={{ marginRight: 8 }}>
                          {t("common.edit")}
                        </Link>
                        <button type="button" className="btn btn-danger" onClick={() => this.deleteUser(u.id, u.username)}>
                          {t("common.delete")}
                        </button>
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
