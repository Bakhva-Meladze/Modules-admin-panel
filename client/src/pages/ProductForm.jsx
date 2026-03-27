import React, { Component, createRef } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSendFormData } from "../api.js";
import { LanguageContext } from "../i18n/languageContext.js";
import { publicImageSrc } from "../utils/imageUrl.js";

export default class ProductForm extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.fileInputRef = createRef();
    this.state = {
      categories: [],
      attributeDefs: [],
      loadingMeta: true,
      loadingProduct: false,
      error: null,
      name: "",
      description_eng: "",
      description_geo: "",
      price: "",
      stock: "",
      category_id: "",
      image_url: "",
      imageFile: null,
      localPreviewUrl: null,
      attributeRows: [],
    };
  }

  componentWillUnmount() {
    const { localPreviewUrl } = this.state;
    if (localPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  componentDidMount() {
    this.loadMeta();
    this.syncMode();
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.router?.params?.id;
    const id = this.props.router?.params?.id;
    const prevPath = prevProps.router?.location?.pathname;
    const path = this.props.router?.location?.pathname;
    if (id !== prevId || path !== prevPath) {
      this.syncMode();
    }
  }

  isEdit = () => {
    const path = this.props.router?.location?.pathname || "";
    return /\/products\/[^/]+\/edit$/.test(path);
  };

  resetFileInput = () => {
    if (this.fileInputRef.current) this.fileInputRef.current.value = "";
  };

  revokeLocalPreview = () => {
    const { localPreviewUrl } = this.state;
    if (localPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  syncMode = async () => {
    this.revokeLocalPreview();
    this.resetFileInput();

    const edit = this.isEdit();
    if (edit) {
      const id = this.props.router?.params?.id;
      this.setState({
        loadingProduct: true,
        error: null,
        imageFile: null,
        localPreviewUrl: null,
      });
      try {
        const product = await apiGet(`/api/products/${id}`);
        this.setState({
          loadingProduct: false,
          name: product.name || "",
          description_eng: product.description_eng || "",
          description_geo: product.description_geo || "",
          price: String(product.price ?? ""),
          stock: String(product.stock ?? ""),
          category_id: String(product.category_id ?? ""),
          image_url: product.image_url || "",
          imageFile: null,
          localPreviewUrl: null,
          attributeRows: (product.attributes || []).map((a) => ({
            attribute_id: String(a.attribute_id),
            attribute_value: a.attribute_value || "",
          })),
        });
      } catch (e) {
        this.setState({ error: e.message, loadingProduct: false });
      }
    } else {
      this.setState({
        loadingProduct: false,
        name: "",
        description_eng: "",
        description_geo: "",
        price: "",
        stock: "",
        category_id: "",
        image_url: "",
        imageFile: null,
        localPreviewUrl: null,
        attributeRows: [],
      });
    }
  };

  loadMeta = async () => {
    try {
      const [categories, attributeDefs] = await Promise.all([
        apiGet("/api/categories"),
        apiGet("/api/attributes"),
      ]);
      this.setState({ categories, attributeDefs, loadingMeta: false });
    } catch (e) {
      this.setState({ error: e.message, loadingMeta: false });
    }
  };

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  addAttrRow = () => {
    this.setState((s) => ({
      attributeRows: [...s.attributeRows, { attribute_id: "", attribute_value: "" }],
    }));
  };

  removeAttrRow = (index) => {
    this.setState((s) => ({
      attributeRows: s.attributeRows.filter((_, i) => i !== index),
    }));
  };

  changeAttrRow = (index, key, value) => {
    this.setState((s) => {
      const attributeRows = s.attributeRows.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      );
      return { attributeRows };
    });
  };

  handleImageChange = (e) => {
    const file = e.target.files?.[0];
    this.setState((s) => {
      if (s.localPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(s.localPreviewUrl);
      }
      if (!file) {
        return { imageFile: null, localPreviewUrl: null };
      }
      return {
        imageFile: file,
        localPreviewUrl: URL.createObjectURL(file),
      };
    });
  };

  clearNewImage = () => {
    this.revokeLocalPreview();
    this.resetFileInput();
    this.setState({ imageFile: null, localPreviewUrl: null });
  };

  submit = async (e) => {
    e.preventDefault();
    const {
      name,
      description_eng,
      description_geo,
      price,
      stock,
      category_id,
      image_url,
      imageFile,
      attributeRows,
    } = this.state;
    const nav = this.props.router?.navigate;
    const { t } = this.context;

    const edit = this.isEdit();
    if (!edit && !imageFile) {
      alert(t("productForm.imageRequired"));
      return;
    }
    if (edit && !imageFile && !String(image_url || "").trim()) {
      alert(t("productForm.imageRequired"));
      return;
    }

    const attributes = attributeRows
      .filter((r) => r.attribute_id)
      .map((r) => ({
        attribute_id: Number(r.attribute_id),
        attribute_value: r.attribute_value,
      }));

    const fd = new FormData();
    fd.append("name", name);
    fd.append("description_eng", description_eng);
    fd.append("description_geo", description_geo);
    fd.append("price", String(Number(price)));
    fd.append("stock", String(Number(stock)));
    fd.append("category_id", String(Number(category_id)));
    fd.append("image_url", String(image_url || "").trim());
    fd.append("attributes", JSON.stringify(attributes));
    if (imageFile) {
      fd.append("image", imageFile, imageFile.name);
    }

    try {
      if (edit) {
        const id = this.props.router?.params?.id;
        await apiSendFormData("PUT", `/api/products/${id}`, fd);
        nav(`/products/${id}`);
      } else {
        const res = await apiSendFormData("POST", "/api/products", fd);
        nav(`/products/${res.id}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  render() {
    const {
      categories,
      attributeDefs,
      loadingMeta,
      loadingProduct,
      error,
      name,
      description_eng,
      description_geo,
      price,
      stock,
      category_id,
      image_url,
      imageFile,
      localPreviewUrl,
      attributeRows,
    } = this.state;

    const edit = this.isEdit();
    const { t } = this.context;
    const previewSrc = localPreviewUrl || publicImageSrc(image_url);

    if (loadingMeta || (edit && loadingProduct)) {
      return <p className="muted">{t("common.loading")}</p>;
    }

    return (
      <div className="form-page">
        <div className="page-header">
          <div>
            <h2>{edit ? t("productForm.editTitle") : t("productForm.newTitle")}</h2>
            <p className="form-page-lede muted">
              {edit ? t("productForm.pageHintEdit") : t("productForm.pageHintNew")}
            </p>
          </div>
          <Link to={edit ? `/products/${this.props.router?.params?.id}` : "/products"} className="btn btn-ghost">
            {t("common.cancel")}
          </Link>
        </div>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={this.submit} className="form-editor">
          <section className="form-section" aria-labelledby="product-section-basics">
            <header className="form-section-header" id="product-section-basics">
              <h3 className="form-section-title">{t("formSection.basics")}</h3>
              <p className="form-section-desc">{t("formSection.basicsDesc")}</p>
            </header>
            <div className="form-section-body">
              <label>
                {t("productForm.name")}
                <input value={name} onChange={this.handleChange("name")} required autoComplete="off" />
              </label>
              <label>
                {t("productForm.category")}
                <select value={category_id} onChange={this.handleChange("category_id")} required>
                  <option value="">{t("productForm.selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_eng} ({c.identifier})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="product-section-inventory">
            <header className="form-section-header" id="product-section-inventory">
              <h3 className="form-section-title">{t("formSection.inventory")}</h3>
              <p className="form-section-desc">{t("formSection.inventoryDesc")}</p>
            </header>
            <div className="form-section-body form-row-2">
              <label>
                {t("productForm.price")}
                <input type="number" step="0.01" min="0" value={price} onChange={this.handleChange("price")} required />
              </label>
              <label>
                {t("productForm.stock")}
                <input type="number" min="0" step="1" value={stock} onChange={this.handleChange("stock")} required />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="product-section-media">
            <header className="form-section-header" id="product-section-media">
              <h3 className="form-section-title">{t("formSection.media")}</h3>
              <p className="form-section-desc">{t("formSection.mediaDesc")}</p>
            </header>
            <div className="form-upload-zone">
              <div className="product-image-field">
                <label>
                  {t("productForm.imageUpload")}
                  <input
                    ref={this.fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={this.handleImageChange}
                    required={!edit}
                  />
                </label>
              </div>
              <p className="form-upload-meta">{t("productForm.imageHint")}</p>
              {edit && image_url ? (
                <p className="form-upload-meta">
                  {t("productForm.currentImage")}: <span style={{ wordBreak: "break-all" }}>{image_url}</span>
                </p>
              ) : null}
              {previewSrc ? (
                <div className="form-upload-preview-wrap">
                  <img src={previewSrc} alt="" className="product-image-preview" />
                  {imageFile ? (
                    <button type="button" className="btn btn-ghost" onClick={this.clearNewImage}>
                      {t("productForm.clearNewImage")}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className="form-section" aria-labelledby="product-section-copy">
            <header className="form-section-header" id="product-section-copy">
              <h3 className="form-section-title">{t("formSection.copy")}</h3>
              <p className="form-section-desc">{t("formSection.copyDesc")}</p>
            </header>
            <div className="form-section-body">
              <label>
                {t("productForm.descEn")}
                <textarea value={description_eng} onChange={this.handleChange("description_eng")} required />
              </label>
              <label>
                {t("productForm.descGeo")}
                <textarea value={description_geo} onChange={this.handleChange("description_geo")} required />
              </label>
            </div>
          </section>

          <section className="form-section form-section-attributes" aria-labelledby="product-section-attr">
            <div className="form-section-head-row" id="product-section-attr">
              <div>
                <h3 className="form-section-title">{t("formSection.attributes")}</h3>
                <p className="form-section-desc">{t("formSection.attributesDesc")}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={this.addAttrRow}>
                {t("productForm.addRow")}
              </button>
            </div>
            {attributeRows.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                {t("formSection.noAttributes")}
              </p>
            ) : (
              <div className="form-attr-rows">
                {attributeRows.map((row, i) => (
                  <div key={i} className="form-attr-card">
                    <div className="attr-row">
                      <label>
                        <span className="muted">{t("productForm.attrType")}</span>
                        <select
                          value={row.attribute_id}
                          onChange={(e) => this.changeAttrRow(i, "attribute_id", e.target.value)}
                        >
                          <option value="">—</option>
                          {attributeDefs.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="muted">{t("productForm.attrValue")}</span>
                        <input
                          value={row.attribute_value}
                          onChange={(e) => this.changeAttrRow(i, "attribute_value", e.target.value)}
                        />
                      </label>
                      <button type="button" className="btn btn-danger" onClick={() => this.removeAttrRow(i)}>
                        {t("productForm.remove")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="form-actions form-actions-bar">
            <button type="submit" className="btn btn-primary btn-lg">
              {edit ? t("productForm.saveChanges") : t("productForm.createProduct")}
            </button>
          </div>
        </form>
      </div>
    );
  }
}
