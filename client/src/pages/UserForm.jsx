import React, { Component } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../api.js";
import { LanguageContext } from "../i18n/languageContext.js";

export default class UserForm extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: null,
      username: "",
      email: "",
      password: "",
    };
  }

  componentDidMount() {
    this.syncMode();
  }

  componentDidUpdate(prevProps) {
    const prevPath = prevProps.router?.location?.pathname;
    const path = this.props.router?.location?.pathname;
    const prevId = prevProps.router?.params?.id;
    const id = this.props.router?.params?.id;
    if (path !== prevPath || id !== prevId) {
      this.syncMode();
    }
  }

  isEdit = () => {
    const path = this.props.router?.location?.pathname || "";
    return /\/users\/[^/]+\/edit$/.test(path);
  };

  syncMode = async () => {
    if (!this.isEdit()) {
      this.setState({ username: "", email: "", password: "", error: null, loading: false });
      return;
    }
    const id = this.props.router?.params?.id;
    this.setState({ loading: true, error: null });
    try {
      const user = await apiGet(`/api/users/${id}`);
      this.setState({
        loading: false,
        username: user.username || "",
        email: user.email || "",
        password: "",
      });
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  submit = async (e) => {
    e.preventDefault();
    const { username, email, password } = this.state;
    const nav = this.props.router?.navigate;

    try {
      if (this.isEdit()) {
        const id = this.props.router?.params?.id;
        const body = { username, email };
        if (password.trim()) body.password = password;
        await apiSend("PUT", `/api/users/${id}`, body);
        nav(`/users/${id}`);
      } else {
        if (!password.trim()) {
          alert(this.context.t("userForm.passwordRequired"));
          return;
        }
        const res = await apiSend("POST", "/api/users", { username, email, password });
        nav(`/users/${res.id}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  render() {
    const { username, email, password, loading, error } = this.state;
    const edit = this.isEdit();
    const { t } = this.context;

    if (edit && loading) return <p className="muted">{t("common.loading")}</p>;

    return (
      <div className="form-page">
        <div className="page-header">
          <div>
            <h2>{edit ? t("userForm.editTitle") : t("userForm.newTitle")}</h2>
            <p className="form-page-lede muted">
              {edit ? t("userForm.pageHintEdit") : t("userForm.pageHintNew")}
            </p>
          </div>
          <Link to={edit ? `/users/${this.props.router?.params?.id}` : "/users"} className="btn btn-ghost">
            {t("common.cancel")}
          </Link>
        </div>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={this.submit} className="form-editor">
          <section className="form-section" aria-labelledby="user-section-profile">
            <header className="form-section-header" id="user-section-profile">
              <h3 className="form-section-title">{t("userForm.sectionProfile")}</h3>
              <p className="form-section-desc">{t("userForm.sectionProfileDesc")}</p>
            </header>
            <div className="form-section-body">
              <label>
                {t("userForm.username")}
                <input value={username} onChange={this.handleChange("username")} required autoComplete="username" />
              </label>
              <label>
                {t("userForm.email")}
                <input type="email" value={email} onChange={this.handleChange("email")} required autoComplete="email" />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="user-section-password">
            <header className="form-section-header" id="user-section-password">
              <h3 className="form-section-title">{t("userForm.sectionPassword")}</h3>
              <p className="form-section-desc">
                {edit ? t("userForm.sectionPasswordEditDesc") : t("userForm.sectionPasswordNewDesc")}
              </p>
            </header>
            <div className="form-section-body">
              <label>
                {edit ? t("userForm.passwordOptional") : t("userForm.password")}
                <input
                  type="password"
                  value={password}
                  onChange={this.handleChange("password")}
                  autoComplete={edit ? "new-password" : "new-password"}
                  required={!edit}
                />
              </label>
            </div>
          </section>

          <div className="form-actions form-actions-bar">
            <button type="submit" className="btn btn-primary btn-lg">
              {edit ? t("common.save") : t("userForm.createUser")}
            </button>
          </div>
        </form>
      </div>
    );
  }
}
