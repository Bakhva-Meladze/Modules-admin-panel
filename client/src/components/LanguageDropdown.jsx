import React, { Component, createRef } from "react";

const FLAGS = { en: "🇬🇧", ka: "🇬🇪" };

export default class LanguageDropdown extends Component {
  constructor(props) {
    super(props);
    this.detailsRef = createRef();
  }

  close = () => {
    const el = this.detailsRef.current;
    if (el) el.open = false;
  };

  pick = (code) => {
    const { setLocale } = this.props;
    setLocale(code);
    this.close();
  };

  render() {
    const { t, locale } = this.props;
    const flag = FLAGS[locale] || FLAGS.en;

    return (
      <details ref={this.detailsRef} className="lang-dropdown">
        <summary className="lang-dropdown-trigger" aria-label={t("lang.label")} title={t("lang.label")}>
          <span className="lang-flag" aria-hidden="true">
            {flag}
          </span>
          <span className="lang-dropdown-code">{locale.toUpperCase()}</span>
          <span className="lang-dropdown-chevron" aria-hidden="true" />
        </summary>
        <div className="lang-dropdown-menu" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={locale === "en"}
            className={`lang-dropdown-item${locale === "en" ? " active" : ""}`}
            onClick={() => this.pick("en")}
          >
            <span className="lang-flag" aria-hidden="true">
              {FLAGS.en}
            </span>
            <span>{t("lang.en")}</span>
          </button>
          <button
            type="button"
            role="option"
            aria-selected={locale === "ka"}
            className={`lang-dropdown-item${locale === "ka" ? " active" : ""}`}
            onClick={() => this.pick("ka")}
          >
            <span className="lang-flag" aria-hidden="true">
              {FLAGS.ka}
            </span>
            <span>{t("lang.ka")}</span>
          </button>
        </div>
      </details>
    );
  }
}
