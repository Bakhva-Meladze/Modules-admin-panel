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
                <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
                  {t("nav.products")}
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
                  {t("nav.users")}
                </NavLink>
                <NavLink to="/chats" className={({ isActive }) => (isActive ? "active" : "")}>
                  {t("nav.chats")}
                </NavLink>
                <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
                  {t("nav.orders")}
                </NavLink>
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
