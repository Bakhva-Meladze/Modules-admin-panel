import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../api.js";
import PaginationBar from "../components/PaginationBar.jsx";
import { PAGE_SIZE } from "../constants/pagination.js";
import { LanguageContext } from "../i18n/languageContext.js";
import { publicImageSrc } from "../utils/imageUrl.js";

export default class ProductsList extends Component {
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
      const data = await apiGet(`/api/products?page=${page}&limit=${PAGE_SIZE}`);
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

  deleteProduct = async (id, name) => {
    const { t } = this.context;
    if (!window.confirm(t("products.deleteConfirm", { name }))) return;
    try {
      await apiSend("DELETE", `/api/products/${id}`);
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
          <h2>{t("products.title")}</h2>
          <Link to="/products/new" className="btn btn-primary">
            {t("products.new")}
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
                    <th className="col-thumb">{t("col.image")}</th>
                    <th>{t("col.name")}</th>
                    <th>{t("col.category")}</th>
                    <th>{t("col.price")}</th>
                    <th>{t("col.stock")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const thumbSrc = publicImageSrc(p.image_url);
                    return (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="col-thumb">
                          {thumbSrc ? (
                            <Link to={`/products/${p.id}`} className="product-list-thumb-link" title={p.name}>
                              <img src={thumbSrc} alt="" className="product-list-thumb" loading="lazy" />
                            </Link>
                          ) : (
                            <span className="product-list-thumb-placeholder" aria-hidden="true">
                              {t("common.dash")}
                            </span>
                          )}
                        </td>
                        <td>{p.name}</td>
                        <td>{p.category_name || t("common.dash")}</td>
                        <td>{p.price}</td>
                        <td>{p.stock}</td>
                        <td>
                          <Link to={`/products/${p.id}`} className="btn btn-ghost" style={{ marginRight: 8 }}>
                            {t("common.view")}
                          </Link>
                          <Link to={`/products/${p.id}/edit`} className="btn btn-ghost" style={{ marginRight: 8 }}>
                            {t("common.edit")}
                          </Link>
                          <button type="button" className="btn btn-danger" onClick={() => this.deleteProduct(p.id, p.name)}>
                            {t("common.delete")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
