import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../api.js";
import { LanguageContext } from "../i18n/languageContext.js";
import { publicImageSrc } from "../utils/imageUrl.js";

export default class ProductDetail extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { product: null, loading: true, error: null };
  }

  componentDidMount() {
    this.fetchProduct();
  }

  componentDidUpdate(prevProps) {
    const id = this.props.router?.params?.id;
    if (id && id !== prevProps.router?.params?.id) {
      this.fetchProduct();
    }
  }

  fetchProduct = async () => {
    const id = this.props.router?.params?.id;
    if (!id) return;
    this.setState({ loading: true, error: null });
    try {
      const product = await apiGet(`/api/products/${id}`);
      this.setState({ product, loading: false });
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  deleteProduct = async () => {
    const { product } = this.state;
    const nav = this.props.router?.navigate;
    const { t } = this.context;
    if (!product || !window.confirm(t("productDetail.deleteConfirm", { name: product.name }))) return;
    try {
      await apiSend("DELETE", `/api/products/${product.id}`);
      nav("/products");
    } catch (e) {
      alert(e.message);
    }
  };

  render() {
    const { product, loading, error } = this.state;
    const id = this.props.router?.params?.id;
    const { t } = this.context;

    if (loading) return <p className="muted">{t("common.loading")}</p>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!product) return <p className="muted">{t("products.notFound", { id })}</p>;

    const imgSrc = publicImageSrc(product.image_url);

    return (
      <div>
        <div className="page-header">
          <h2>{product.name}</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link to="/products" className="btn btn-ghost">
              {t("common.back")}
            </Link>
            <Link to={`/products/${product.id}/edit`} className="btn btn-primary">
              {t("common.edit")}
            </Link>
            <button type="button" className="btn btn-danger" onClick={this.deleteProduct}>
              {t("common.delete")}
            </button>
          </div>
        </div>

        <div className="detail-card">
          <dl>
            <dt>{t("col.id")}</dt>
            <dd>{product.id}</dd>
            <dt>{t("productDetail.category")}</dt>
            <dd>{product.category_name || product.category_id}</dd>
            <dt>{t("productDetail.price")}</dt>
            <dd>{product.price}</dd>
            <dt>{t("productDetail.stock")}</dt>
            <dd>{product.stock}</dd>
            <dt>{t("productDetail.image")}</dt>
            <dd>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  className="product-detail-img"
                />
              ) : null}
              <div className="muted" style={{ wordBreak: "break-all", marginTop: 8, fontSize: "0.85rem" }}>
                {product.image_url}
              </div>
            </dd>
            <dt>{t("productDetail.descEn")}</dt>
            <dd>{product.description_eng}</dd>
            <dt>{t("productDetail.descGeo")}</dt>
            <dd>{product.description_geo}</dd>
          </dl>
        </div>

        {product.attributes && product.attributes.length > 0 && (
          <>
            <h3 style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>{t("productDetail.attributes")}</h3>
            <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>{t("col.attribute")}</th>
                    <th>{t("col.value")}</th>
                  </tr>
                </thead>
                <tbody>
                  {product.attributes.map((a) => (
                    <tr key={a.id}>
                      <td>{a.attribute_name || a.attribute_id}</td>
                      <td>{a.attribute_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }
}
