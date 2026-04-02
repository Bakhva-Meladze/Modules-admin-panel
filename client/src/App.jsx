import React, { Component } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { LanguageContext } from "./i18n/languageContext.js";
import LanguageDropdown from "./components/LanguageDropdown.jsx";
import { withRouter } from "./withRouter.jsx";
import ProductsList from "./pages/ProductsList.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import ProductForm from "./pages/ProductForm.jsx";
import UsersList from "./pages/UsersList.jsx";
import UserDetail from "./pages/UserDetail.jsx";
import UserForm from "./pages/UserForm.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";
import OrdersList from "./pages/OrdersList.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";

const ProductDetailR = withRouter(ProductDetail);
const ProductFormR = withRouter(ProductForm);
const UserDetailR = withRouter(UserDetail);
const UserFormR = withRouter(UserForm);
const OrderDetailR = withRouter(OrderDetail);
const NAV_ITEMS = [
  { to: "/products", labelKey: "nav.products" },
  { to: "/users", labelKey: "nav.users" },
  { to: "/chats", labelKey: "nav.chats" },
  { to: "/orders", labelKey: "nav.orders" },
];

export default class App extends Component {
  static contextType = LanguageContext;

  render() {
    const { t, locale, setLocale } = this.context;

    return (
      <BrowserRouter>
        <div className="app-layout">
          <header className="top-bar" role="banner">
            <span className="top-bar-brand">{t("app.brand")}</span>
            <span className="top-bar-spacer" aria-hidden="true" />
            <LanguageDropdown t={t} locale={locale} setLocale={setLocale} />
          </header>
          <div className="app-shell">
            <aside className="sidebar">
              <nav aria-label={t("nav.main")}>
                {NAV_ITEMS.map(({ to, labelKey }) => (
                  <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
                    {t(labelKey)}
                  </NavLink>
                ))}
              </nav>
            </aside>
            <main className="page">
              <Routes>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/products/new" element={<ProductFormR />} />
                <Route path="/products/:id/edit" element={<ProductFormR />} />
                <Route path="/products/:id" element={<ProductDetailR />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/users/new" element={<UserFormR />} />
                <Route path="/users/:id/edit" element={<UserFormR />} />
                <Route path="/users/:id" element={<UserDetailR />} />
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="/orders" element={<OrdersList />} />
                <Route path="/orders/:id" element={<OrderDetailR />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    );
  }
}
