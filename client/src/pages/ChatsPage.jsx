import React, { Component } from "react";
import { apiGet, apiSend } from "../api.js";
import PaginationBar from "../components/PaginationBar.jsx";
import { PAGE_SIZE } from "../constants/pagination.js";
import { LanguageContext } from "../i18n/languageContext.js";

export default class ChatsPage extends Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      chats: [],
      chatPage: 1,
      chatTotalPages: 1,
      chatTotal: 0,
      chatLimit: PAGE_SIZE,
      selectedId: null,
      thread: null,
      loadingList: true,
      loadingThread: false,
      sending: false,
      replyText: "",
      error: null,
    };
  }

  componentDidMount() {
    this.loadChats(1);
  }

  loadChats = async (requestedPage) => {
    const page = requestedPage ?? this.state.chatPage;
    this.setState({ loadingList: true, error: null });
    try {
      const data = await apiGet(`/api/chats?page=${page}&limit=${PAGE_SIZE}`);
      const { items, total, page: resPage, totalPages, limit } = data;
      if (items.length === 0 && resPage > 1) {
        return this.loadChats(resPage - 1);
      }
      this.setState((s) => {
        const stillHere = items.some((c) => c.id === s.selectedId);
        return {
          chats: items,
          chatPage: resPage,
          chatTotalPages: totalPages,
          chatTotal: total,
          chatLimit: limit,
          loadingList: false,
          ...(stillHere
            ? {}
            : {
                selectedId: null,
                thread: null,
                loadingThread: false,
                replyText: "",
              }),
        };
      });
    } catch (e) {
      this.setState({ error: e.message, loadingList: false });
    }
  };

  selectChat = async (id) => {
    this.setState({ selectedId: id, loadingThread: true, error: null, replyText: "" });
    try {
      const thread = await apiGet(`/api/chats/${id}/messages`);
      this.setState({ thread, loadingThread: false });
    } catch (e) {
      this.setState({ error: e.message, loadingThread: false, thread: null });
    }
  };

  handleReplyChange = (e) => {
    this.setState({ replyText: e.target.value });
  };

  sendReply = async (e) => {
    e.preventDefault();
    const { selectedId, replyText } = this.state;
    const trimmed = replyText.trim();
    if (!selectedId || !trimmed) return;

    this.setState({ sending: true, error: null });
    try {
      const msg = await apiSend("POST", `/api/chats/${selectedId}/messages`, { text: trimmed });
      this.setState((s) => ({
        sending: false,
        replyText: "",
        thread: s.thread
          ? { ...s.thread, messages: [...s.thread.messages, msg] }
          : s.thread,
        chats: s.chats.map((c) =>
          c.id === selectedId ? { ...c, message_count: (Number(c.message_count) || 0) + 1 } : c
        ),
      }));
    } catch (err) {
      this.setState({ sending: false, error: err.message });
    }
  };

  render() {
    const {
      chats,
      chatPage,
      chatTotalPages,
      chatTotal,
      chatLimit,
      selectedId,
      thread,
      loadingList,
      loadingThread,
      sending,
      replyText,
      error,
    } = this.state;
    const { t } = this.context;

    return (
      <div>
        <div className="page-header">
          <h2>{t("chats.title")}</h2>
        </div>
        {error && <div className="error-banner">{error}</div>}

        <div className="chats-layout">
          <div className="chat-list-column">
            <div className="chat-list">
              {loadingList ? (
                <p className="muted" style={{ padding: "1rem" }}>
                  {t("common.loading")}
                </p>
              ) : chats.length === 0 ? (
                <p className="muted" style={{ padding: "1rem" }}>
                  {t("chats.noChats")}
                </p>
              ) : (
                chats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`row${selectedId === c.id ? " active" : ""}`}
                    onClick={() => this.selectChat(c.id)}
                  >
                    <strong>{t("chats.chatLabel", { id: c.id })}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                      {c.username || t("common.user")} · {c.email || t("common.dash")}
                    </div>
                    <div className="muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                      {t("chats.sessionLine", {
                        snippet: c.session_id?.slice(0, 12) || "",
                        count: c.message_count,
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
            {!loadingList && (chatTotal > 0 || chatPage > 1) && (
              <PaginationBar
                page={chatPage}
                totalPages={chatTotalPages}
                total={chatTotal}
                limit={chatLimit}
                onPageChange={(p) => this.loadChats(p)}
                t={t}
              />
            )}
          </div>

          <div className="messages-panel">
            {!selectedId && <p className="muted">{t("chats.selectChat")}</p>}
            {selectedId && loadingThread && <p className="muted">{t("chats.loadingMessages")}</p>}
            {selectedId && !loadingThread && thread && (
              <>
                <div className="muted" style={{ marginBottom: 4, flexShrink: 0 }}>
                  {t("chats.userLine", {
                    userId: thread.chat.user_id,
                    name:
                      thread.chat.username ||
                      thread.chat.email ||
                      t("common.dash"),
                  })}
                </div>
                <div className="messages-scroll">
                  {thread.messages.length === 0 ? (
                    <p className="muted">{t("chats.noMessagesInChat")}</p>
                  ) : (
                    thread.messages.map((m) => {
                      const isAdmin = String(m.sender).toLowerCase() === "admin";
                      return (
                        <div key={m.id} className={`bubble ${isAdmin ? "admin" : "user"}`}>
                          <div>{m.text}</div>
                          <div className="bubble-meta">
                            {m.sender} · {m.created_at || t("common.dash")}
                            {m.email ? ` · ${m.email}` : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chat-reply" onSubmit={this.sendReply}>
                  <label className="chat-reply-label">
                    <span className="muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: 6 }}>
                      {t("chats.replyAsAdmin")}
                    </span>
                    <textarea
                      value={replyText}
                      onChange={this.handleReplyChange}
                      placeholder={t("chats.replyPlaceholder")}
                      rows={3}
                      disabled={sending}
                    />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={sending || !replyText.trim()}>
                    {sending ? t("common.sending") : t("common.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}
