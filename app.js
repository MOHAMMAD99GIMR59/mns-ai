"use strict";

/* =========================================
   MNS AI
   CHAT + AUTH + CHAT HISTORY SYSTEM
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");
const registerPassword2 = document.getElementById("registerPassword2");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");

const authMessage = document.getElementById("authMessage");

const accountUsername = document.getElementById("accountUsername");
const logoutBtn = document.getElementById("logoutBtn");

const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");

const sendBtn = document.getElementById("sendBtn");
const imageBtn = document.getElementById("imageBtn");

const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

const statusText = document.getElementById("status");
const welcome = document.getElementById("welcome");

const settingsBtn = document.getElementById("settingsBtn");
const homeBtn = document.getElementById("homeBtn");

const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsBtn =
    document.getElementById("closeSettingsBtn");

const themeSelect = document.getElementById("themeSelect");
const fontSelect = document.getElementById("fontSelect");

const codingMode = document.getElementById("codingMode");

const colorOptions =
    document.querySelectorAll(".color-option");


/* =========================================
   CHAT HISTORY ELEMENTS
========================================= */

const historyBtn =
    document.getElementById("historyBtn");

const closeHistoryBtn =
    document.getElementById("closeHistoryBtn");

const historyOverlay =
    document.getElementById("historyOverlay");

const chatHistoryPanel =
    document.getElementById("chatHistoryPanel");

const chatHistoryList =
    document.getElementById("chatHistoryList");

const historyNewChatBtn =
    document.getElementById("historyNewChatBtn");


/* =========================================
   STORAGE KEYS
========================================= */

const STORAGE_KEY = "MNS_AI_PRO_MESSAGES";

const CHATS_KEY = "MNS_AI_CHATS";

const ACTIVE_CHAT_KEY = "MNS_AI_ACTIVE_CHAT";

const SETTINGS_KEY = "MNS_AI_PRO_SETTINGS";

const MESSAGE_COLOR_KEY =
    "MNS_AI_MESSAGE_COLOR";

const CODING_MODE_KEY =
    "MNS_AI_CODING_MODE";

const SESSION_KEY =
    "MNS_AI_SESSION";

const USER_KEY =
    "MNS_AI_USER";


let messages = [];

let isBusy = false;

let currentUser = null;

let chats = [];

let activeChatId = null;


/* =========================================
   SESSION
========================================= */

function getSessionId() {

    return localStorage.getItem(
        SESSION_KEY
    );
}


function saveSession(
    sessionId
) {

    if (!sessionId) {
        return;
    }

    localStorage.setItem(
        SESSION_KEY,
        sessionId
    );
}


function clearSession() {

    localStorage.removeItem(
        SESSION_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );
}


/* =========================================
   AUTH HEADERS
========================================= */

function getAuthHeaders() {

    const sessionId =
        getSessionId();

    const headers = {
        "Content-Type":
            "application/json"
    };

    if (sessionId) {

        headers[
            "X-MNS-Session"
        ] = sessionId;
    }

    return headers;
}


/* =========================================
   AUTH MESSAGE
========================================= */

function showAuthMessage(
    text,
    type = "error"
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        text;

    authMessage.className =
        "auth-message " + type;
}


/* =========================================
   LOGIN / REGISTER FORM
========================================= */

function showLoginForm() {

    if (loginForm) {
        loginForm.style.display =
            "block";
    }

    if (registerForm) {
        registerForm.style.display =
            "none";
    }

    showAuthMessage("");

    if (loginUsername) {
        loginUsername.focus();
    }
}


function showRegisterForm() {

    if (loginForm) {
        loginForm.style.display =
            "none";
    }

    if (registerForm) {
        registerForm.style.display =
            "block";
    }

    showAuthMessage("");

    if (registerUsername) {
        registerUsername.focus();
    }
}


/* =========================================
   USER CHAT STORAGE
========================================= */

function getChatsStorageKey() {

    if (!currentUser) {

        return CHATS_KEY;
    }

    return (
        CHATS_KEY +
        "_" +
        currentUser.username
    );
}


function getActiveChatStorageKey() {

    if (!currentUser) {

        return ACTIVE_CHAT_KEY;
    }

    return (
        ACTIVE_CHAT_KEY +
        "_" +
        currentUser.username
    );
}


/* =========================================
   CHAT ID
========================================= */

function createChatId() {

    return (
        "chat_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


/* =========================================
   CHAT TITLE
========================================= */

function getChatTitle(
    chatObject
) {

    if (
        !chatObject ||
        !Array.isArray(
            chatObject.messages
        )
    ) {

        return "گفتگوی جدید";
    }


    const firstUserMessage =
        chatObject.messages.find(
            function(message) {

                return (
                    message &&
                    message.role === "user" &&
                    typeof message.content ===
                        "string"
                );

            }
        );


    if (
        !firstUserMessage ||
        !firstUserMessage.content.trim()
    ) {

        return "گفتگوی جدید";
    }


    let title =
        firstUserMessage.content
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (title.length > 38) {

        title =
            title.substring(
                0,
                38
            ) +
            "...";
    }


    return title;
}


/* =========================================
   SAVE CHATS
========================================= */

function saveChats() {

    if (!currentUser) {
        return;
    }


    try {

        localStorage.setItem(
            getChatsStorageKey(),
            JSON.stringify(
                chats
            )
        );

        localStorage.setItem(
            getActiveChatStorageKey(),
            activeChatId || ""
        );

    } catch (error) {

        console.log(
            "Chat history save error:",
            error
        );
    }
}


/* =========================================
   CREATE CHAT OBJECT
========================================= */

function createEmptyChat() {

    return {

        id:
            createChatId(),

        title:
            "گفتگوی جدید",

        messages:
            [],

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };
}


/* =========================================
   LOAD CHAT HISTORY
========================================= */

function loadChatHistory() {

    chats = [];

    activeChatId = null;


    if (!currentUser) {
        return;
    }


    try {

        const savedChats =
            localStorage.getItem(
                getChatsStorageKey()
            );


        if (savedChats) {

            const parsed =
                JSON.parse(
                    savedChats
                );


            if (
                Array.isArray(parsed)
            ) {

                chats =
                    parsed.filter(
                        function(item) {

                            return (
                                item &&
                                typeof item.id ===
                                    "string" &&
                                Array.isArray(
                                    item.messages
                                )
                            );

                        }
                    );
            }
        }


        const savedActive =
            localStorage.getItem(
                getActiveChatStorageKey()
            );


        if (savedActive) {

            activeChatId =
                savedActive;
        }


        /*
         * MIGRATION
         * نسخه قدیمی فقط یک آرایه پیام داشت.
         * آن را به یک چت تبدیل می‌کنیم.
         */

        if (!chats.length) {

            const oldMemory =
                localStorage.getItem(
                    getUserStorageKey()
                );


            if (oldMemory) {

                try {

                    const oldMessages =
                        JSON.parse(
                            oldMemory
                        );


                    if (
                        Array.isArray(
                            oldMessages
                        ) &&
                        oldMessages.length
                    ) {

                        const migrated =
                            createEmptyChat();


                        migrated.messages =
                            oldMessages;


                        migrated.title =
                            getChatTitle(
                                migrated
                            );


                        chats.push(
                            migrated
                        );

                        activeChatId =
                            migrated.id;

                    }

                } catch (error) {

                    console.log(
                        "Old memory migration error:",
                        error
                    );
                }
            }
        }


        if (!chats.length) {

            const firstChat =
                createEmptyChat();


            chats.push(
                firstChat
            );


            activeChatId =
                firstChat.id;
        }


        const activeExists =
            chats.some(
                function(item) {

                    return (
                        item.id ===
                        activeChatId
                    );

                }
            );


        if (!activeExists) {

            activeChatId =
                chats[0].id;
        }


        chats.forEach(
            function(item) {

                item.title =
                    getChatTitle(
                        item
                    );

            }
        );


        saveChats();


    } catch (error) {

        console.log(
            "Chat history load error:",
            error
        );


        const firstChat =
            createEmptyChat();


        chats = [
            firstChat
        ];

        activeChatId =
            firstChat.id;

        saveChats();
    }
}


/* =========================================
   GET ACTIVE CHAT
========================================= */

function getActiveChat() {

    if (!activeChatId) {
        return null;
    }


    return chats.find(
        function(item) {

            return (
                item.id ===
                activeChatId
            );

        }
    ) || null;
}


/* =========================================
   UPDATE ACTIVE CHAT
========================================= */

function updateActiveChat() {

    const active =
        getActiveChat();


    if (!active) {
        return;
    }


    active.messages =
        messages.slice();


    active.title =
        getChatTitle(
            active
        );


    active.updatedAt =
        new Date().toISOString();


    saveChats();

    renderChatHistory();
}


/* =========================================
   LOAD ACTIVE CHAT
========================================= */

function loadActiveChat() {

    const active =
        getActiveChat();


    if (!active) {

        messages = [];

        return;
    }


    if (
        Array.isArray(
            active.messages
        )
    ) {

        messages =
            active.messages.slice();

    } else {

        messages = [];
    }
}


/* =========================================
   RENDER CHAT HISTORY
========================================= */

function renderChatHistory() {

    if (!chatHistoryList) {
        return;
    }


    chatHistoryList.innerHTML =
        "";


    if (!chats.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "mns-history-empty";


        empty.textContent =
            "هنوز گفتگویی ساخته نشده.";


        chatHistoryList.appendChild(
            empty
        );


        return;
    }


    const sortedChats =
        chats.slice().sort(
            function(a, b) {

                return (
                    new Date(
                        b.updatedAt ||
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.updatedAt ||
                        a.createdAt ||
                        0
                    )
                );

            }
        );


    sortedChats.forEach(
        function(chatItem) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "mns-history-item";


            if (
                chatItem.id ===
                activeChatId
            ) {

                item.classList.add(
                    "active"
                );
            }


            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "mns-history-main";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "mns-history-title";


            title.textContent =
                chatItem.title ||
                "گفتگوی جدید";


            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "mns-history-time";


            time.textContent =
                formatChatTime(
                    chatItem.updatedAt ||
                    chatItem.createdAt
                );


            main.appendChild(
                title
            );

            main.appendChild(
                time
            );


            const deleteBtn =
                document.createElement(
                    "button"
                );


            deleteBtn.type =
                "button";


            deleteBtn.className =
                "mns-history-delete";


            deleteBtn.title =
                "حذف گفتگو";


            deleteBtn.textContent =
                "🗑️";


            deleteBtn.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    deleteChat(
                        chatItem.id
                    );

                }
            );


            item.appendChild(
                main
            );

            item.appendChild(
                deleteBtn
            );


            item.addEventListener(
                "click",
                function() {

                    selectChat(
                        chatItem.id
                    );

                }
            );


            chatHistoryList.appendChild(
                item
            );

        }
    );
}


/* =========================================
   CHAT TIME
========================================= */

function formatChatTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const now =
        new Date();


    const sameDay =
        date.toDateString() ===
        now.toDateString();


    if (sameDay) {

        return (
            "امروز • " +
            date.toLocaleTimeString(
                "fa-IR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        );
    }


    return date.toLocaleDateString(
        "fa-IR",
        {
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================
   OPEN HISTORY
========================================= */

function openHistory() {

    if (!chatHistoryPanel) {
        return;
    }


    renderChatHistory();


    chatHistoryPanel.classList.add(
        "show"
    );
}


/* =========================================
   CLOSE HISTORY
========================================= */

function closeHistory() {

    if (!chatHistoryPanel) {
        return;
    }


    chatHistoryPanel.classList.remove(
        "show"
    );
}


/* =========================================
   SELECT CHAT
========================================= */

function selectChat(
    id
) {

    if (isBusy) {
        return;
    }


    const exists =
        chats.some(
            function(item) {

                return item.id === id;

            }
        );


    if (!exists) {
        return;
    }


    activeChatId =
        id;


    saveChats();

    restoreMemory();

    closeHistory();

    if (input) {
        input.focus();
    }
}


/* =========================================
   DELETE CHAT
========================================= */

function deleteChat(
    id
) {

    const target =
        chats.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!target) {
        return;
    }


    const ok =
        confirm(
            "این گفتگو حذف شود؟"
        );


    if (!ok) {
        return;
    }


    chats =
        chats.filter(
            function(item) {

                return item.id !== id;

            }
        );


    if (!chats.length) {

        const newEmpty =
            createEmptyChat();


        chats.push(
            newEmpty
        );


        activeChatId =
            newEmpty.id;

    } else if (
        activeChatId === id
    ) {

        chats.sort(
            function(a, b) {

                return (
                    new Date(
                        b.updatedAt ||
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.updatedAt ||
                        a.createdAt ||
                        0
                    )
                );

            }
        );


        activeChatId =
            chats[0].id;
    }


    saveChats();

    restoreMemory();

    renderChatHistory();
}


/* =========================================
   NEW CHAT
========================================= */

function newChat() {

    if (isBusy) {
        return;
    }


    const current =
        getActiveChat();


    /*
     * اگر چت فعلی خالی است،
     * چت اضافه نمی‌کنیم.
     */

    if (
        current &&
        current.messages.length === 0
    ) {

        activeChatId =
            current.id;

        restoreMemory();

        closeHistory();

        input.focus();

        return;
    }


    const newChatObject =
        createEmptyChat();


    chats.unshift(
        newChatObject
    );


    activeChatId =
        newChatObject.id;


    messages = [];


    saveChats();

    restoreMemory();

    renderChatHistory();

    closeHistory();


    if (input) {

        input.value =
            "";

        resizeInput();

        input.focus();
    }


    setStatus(
        "● آنلاین",
        "#63df87"
    );
}


/* =========================================
   USER MEMORY
========================================= */

function getUserStorageKey() {

    if (!currentUser) {

        return STORAGE_KEY;
    }


    return (
        STORAGE_KEY +
        "_" +
        currentUser.username
    );
}


/*
 * این دو تابع برای سازگاری با
 * نسخه قبلی نگه داشته شده‌اند.
 */

function loadUserMemory() {

    loadActiveChat();
}


function saveUserMemory() {

    updateActiveChat();
}


/* =========================================
   SHOW MAIN APP
========================================= */

function showMainApp(
    user
) {

    currentUser =
        user || null;


    if (authScreen) {
        authScreen.style.display =
            "none";
    }


    if (mainApp) {
        mainApp.style.display =
            "block";
    }


    if (
        accountUsername &&
        currentUser
    ) {

        accountUsername.textContent =
            currentUser.username;
    }


    loadChatHistory();

    restoreMemory();

    renderChatHistory();


    if (input) {
        input.focus();
    }
}


/* =========================================
   SHOW AUTH SCREEN
========================================= */

function showAuthScreen() {

    currentUser =
        null;


    chats = [];

    activeChatId =
        null;


    if (mainApp) {
        mainApp.style.display =
            "none";
    }


    if (authScreen) {
        authScreen.style.display =
            "flex";
    }


    closeHistory();

    showLoginForm();
}


/* =========================================
   AUTH REQUEST
========================================= */

async function authRequest(
    url,
    body
) {

    const response =
        await fetch(
            url,
            {
                method:
                    "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify(body)
            }
        );


    let data = {};


    try {

        data =
            await response.json();

    } catch (error) {}


    if (!response.ok) {

        throw new Error(
            data.error ||
            "خطا در ارتباط با سرور."
        );
    }


    return data;
}


/* =========================================
   REGISTER
========================================= */

async function register() {

    if (
        !registerUsername ||
        !registerPassword ||
        !registerPassword2 ||
        !registerBtn
    ) {
        return;
    }


    const username =
        registerUsername.value.trim();

    const password =
        registerPassword.value;

    const password2 =
        registerPassword2.value;


    if (!username) {

        showAuthMessage(
            "نام کاربری را وارد کن."
        );

        return;
    }


    if (username.length < 3) {

        showAuthMessage(
            "نام کاربری باید حداقل ۳ کاراکتر باشد."
        );

        return;
    }


    if (password.length < 6) {

        showAuthMessage(
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        );

        return;
    }


    if (password !== password2) {

        showAuthMessage(
            "رمزهای عبور یکسان نیستند."
        );

        return;
    }


    registerBtn.disabled =
        true;


    showAuthMessage(
        "در حال ساخت حساب...",
        "loading"
    );


    try {

        const data =
            await authRequest(
                "/api/register",
                {
                    username:
                        username,

                    password:
                        password
                }
            );


        if (
            !data.user ||
            !data.sessionId
        ) {

            throw new Error(
                "اطلاعات حساب از سرور دریافت نشد."
            );
        }


        currentUser =
            data.user;


        saveSession(
            data.sessionId
        );


        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                currentUser
            )
        );


        messages = [];


        registerUsername.value =
            "";

        registerPassword.value =
            "";

        registerPassword2.value =
            "";


        showMainApp(
            currentUser
        );


    } catch (error) {

        showAuthMessage(
            "❌ " +
            error.message
        );

    } finally {

        registerBtn.disabled =
            false;
    }
}


/* =========================================
   LOGIN
========================================= */

async function login() {

    if (
        !loginUsername ||
        !loginPassword ||
        !loginBtn
    ) {
        return;
    }


    const username =
        loginUsername.value.trim();

    const password =
        loginPassword.value;


    if (
        !username ||
        !password
    ) {

        showAuthMessage(
            "نام کاربری و رمز عبور را وارد کن."
        );

        return;
    }


    loginBtn.disabled =
        true;


    showAuthMessage(
        "در حال ورود...",
        "loading"
    );


    try {

        const data =
            await authRequest(
                "/api/login",
                {
                    username:
                        username,

                    password:
                        password
                }
            );


        if (
            !data.user ||
            !data.sessionId
        ) {

            throw new Error(
                "اطلاعات ورود از سرور دریافت نشد."
            );
        }


        currentUser =
            data.user;


        saveSession(
            data.sessionId
        );


        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                currentUser
            )
        );


        loginPassword.value =
            "";


        showMainApp(
            currentUser
        );


    } catch (error) {

        showAuthMessage(
            "❌ " +
            error.message
        );

    } finally {

        loginBtn.disabled =
            false;
    }
}


/* =========================================
   LOGOUT
========================================= */

async function logout() {

    try {

        await fetch(
            "/api/logout",
            {
                method:
                    "POST",

                headers:
                    getAuthHeaders()
            }
        );

    } catch (error) {

        console.log(
            "Logout error:",
            error
        );
    }


    clearSession();


    messages = [];

    chats = [];

    activeChatId =
        null;

    currentUser =
        null;


    if (chat) {

        chat.innerHTML =
            "";

        if (welcome) {

            welcome.style.display =
                "block";

            chat.appendChild(
                welcome
            );
        }
    }


    closeSettings();

    closeHistory();

    showAuthScreen();
}


/* =========================================
   CHECK LOGIN
========================================= */

async function checkLogin() {

    const sessionId =
        getSessionId();


    if (!sessionId) {

        showAuthScreen();

        return;
    }


    try {

        const response =
            await fetch(
                "/api/me",
                {
                    method:
                        "GET",

                    headers:
                        getAuthHeaders()
                }
            );


        if (!response.ok) {

            clearSession();

            showAuthScreen();

            return;
        }


        const data =
            await response.json();


        if (
            data.loggedIn &&
            data.user
        ) {

            currentUser =
                data.user;


            localStorage.setItem(
                USER_KEY,
                JSON.stringify(
                    currentUser
                )
            );


            showMainApp(
                currentUser
            );

        } else {

            clearSession();

            showAuthScreen();
        }


    } catch (error) {

        console.log(
            "Auth check error:",
            error
        );


        showAuthScreen();
    }
}


/* =========================================
   MESSAGE COLORS
========================================= */

function getMessageColor(
    color
) {

    const colors = {

        purple:
            "#7c3aed",

        blue:
            "#2563eb",

        yellow:
            "#eab308",

        green:
            "#16a34a",

        red:
            "#dc2626",

        pink:
            "#ec4899"

    };


    return (
        colors[color] ||
        colors.purple
    );
}


function applyMessageColor(
    color
) {

    const finalColor =
        getMessageColor(
            color
        );


    document.documentElement.style.setProperty(
        "--user-message-color",
        finalColor
    );
}


function loadMessageColor() {

    const savedColor =
        localStorage.getItem(
            MESSAGE_COLOR_KEY
        ) || "purple";


    applyMessageColor(
        savedColor
    );


    colorOptions.forEach(
        function(option) {

            if (
                option.dataset.color ===
                savedColor
            ) {

                option.classList.add(
                    "selected"
                );

            } else {

                option.classList.remove(
                    "selected"
                );
            }

        }
    );
}


function setupMessageColors() {

    colorOptions.forEach(
        function(option) {

            option.addEventListener(
                "click",
                function() {

                    const color =
                        option.dataset.color;


                    localStorage.setItem(
                        MESSAGE_COLOR_KEY,
                        color
                    );


                    applyMessageColor(
                        color
                    );


                    colorOptions.forEach(
                        function(item) {

                            item.classList.remove(
                                "selected"
                            );

                        }
                    );


                    option.classList.add(
                        "selected"
                    );

                }
            );

        }
    );
}


/* =========================================
   SETTINGS
========================================= */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (!saved) {
            return;
        }


        const settings =
            JSON.parse(saved);


        if (
            settings.theme &&
            themeSelect
        ) {

            themeSelect.value =
                settings.theme;

            applyTheme(
                settings.theme
            );
        }


        if (
            settings.font &&
            fontSelect
        ) {

            fontSelect.value =
                settings.font;

            applyFont(
                settings.font
            );
        }


        if (
            typeof settings.codingMode ===
            "boolean" &&
            codingMode
        ) {

            codingMode.checked =
                settings.codingMode;
        }


    } catch (error) {

        console.log(
            "Settings error:",
            error
        );
    }
}


function saveSettings() {

    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({

                theme:
                    themeSelect
                        ? themeSelect.value
                        : "dark",

                font:
                    fontSelect
                        ? fontSelect.value
                        : "normal",

                codingMode:
                    codingMode
                        ? codingMode.checked
                        : false

            })
        );

    } catch (error) {}
}


/* =========================================
   CODING MODE
========================================= */

function setupCodingMode() {

    if (!codingMode) {
        return;
    }


    const saved =
        localStorage.getItem(
            CODING_MODE_KEY
        );


    if (saved !== null) {

        codingMode.checked =
            saved === "true";
    }


    codingMode.addEventListener(
        "change",
        function() {

            localStorage.setItem(
                CODING_MODE_KEY,
                codingMode.checked
            );

            saveSettings();

        }
    );
}


/* =========================================
   SECURITY / HTML
========================================= */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text);


    return div.innerHTML;
}


/* =========================================
   CODE FORMATTER
========================================= */

function formatMessage(
    text
) {

    const source =
        String(text);


    const codeRegex =
        /```([a-zA-Z0-9_+#.-]+)?\s*\n?([\s\S]*?)```/g;


    let result = "";

    let lastIndex = 0;

    let match;


    while (
        (match =
            codeRegex.exec(
                source
            )) !== null
    ) {

        const normalText =
            source.substring(
                lastIndex,
                match.index
            );


        if (normalText) {

            result +=
                escapeHTML(
                    normalText
                ).replace(
                    /\n/g,
                    "<br>"
                );
        }


        const language =
            match[1] ||
            "code";


        const code =
            match[2]
                .replace(
                    /^\n/,
                    ""
                )
                .replace(
                    /\n$/,
                    ""
                );


        result += `

<div class="code-block">

    <div class="code-header">

        <span class="code-language">
            ${escapeHTML(language)}
        </span>

        <button
            type="button"
            class="copy-code"
            data-code="${encodeURIComponent(code)}">
            📋 کپی
        </button>

    </div>

    <pre><code>${escapeHTML(code)}</code></pre>

</div>

`;


        lastIndex =
            codeRegex.lastIndex;
    }


    const remaining =
        source.substring(
            lastIndex
        );


    if (remaining) {

        result +=
            escapeHTML(
                remaining
            ).replace(
                /\n/g,
                "<br>"
            );
    }


    return result;
}


/* =========================================
   COPY CODE
========================================= */

document.addEventListener(
    "click",
    async function(event) {

        const button =
            event.target.closest(
                ".copy-code"
            );


        if (!button) {
            return;
        }


        try {

            const code =
                decodeURIComponent(
                    button.dataset.code
                );


            await navigator.clipboard.writeText(
                code
            );


            const oldText =
                button.textContent;


            button.textContent =
                "✅ کپی شد";


            setTimeout(
                function() {

                    button.textContent =
                        oldText;

                },
                1500
            );


        } catch (error) {

            button.textContent =
                "❌ خطا";
        }

    }
);


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(
    text,
    type,
    save = true
) {

    if (!chat) {
        return;
    }


    if (welcome) {

        welcome.style.display =
            "none";
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row " +
        type;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message " +
        type;


    if (type === "user") {

        bubble.style.background =
            "var(--user-message-color)";
    }


    if (type === "ai") {

        bubble.innerHTML =
            formatMessage(
                text
            );

    } else {

        bubble.innerHTML =
            escapeHTML(
                text
            ).replace(
                /\n/g,
                "<br>"
            );
    }


    row.appendChild(
        bubble
    );


    chat.appendChild(
        row
    );


    chat.scrollTop =
        chat.scrollHeight;


    if (save) {

        messages.push({

            role:
                type === "user"
                    ? "user"
                    : "assistant",

            content:
                String(text)

        });


        saveUserMemory();
    }
}


/* =========================================
   IMAGE MESSAGE
========================================= */

function addImageMessage(
    imageUrl,
    prompt,
    save = true
) {

    if (!chat) {
        return;
    }


    if (welcome) {

        welcome.style.display =
            "none";
    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row ai";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message ai image-message";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        imageUrl;


    image.alt =
        prompt ||
        "MNS AI image";


    image.loading =
        "lazy";


    bubble.appendChild(
        image
    );


    row.appendChild(
        bubble
    );


    chat.appendChild(
        row
    );


    chat.scrollTop =
        chat.scrollHeight;


    if (save) {

        messages.push({

            role:
                "assistant",

            content:
                "[IMAGE]" +
                imageUrl

        });


        saveUserMemory();
    }
}


/* =========================================
   TYPING
========================================= */

function showTyping() {

    removeTyping();


    const row =
        document.createElement(
            "div"
        );


    row.id =
        "typingMessage";


    row.className =
        "message-row ai";


    row.innerHTML = `

        <div class="typing">

            <span class="dot"></span>

            <span class="dot"></span>

            <span class="dot"></span>

        </div>

    `;


    chat.appendChild(
        row
    );


    chat.scrollTop =
        chat.scrollHeight;
}


function removeTyping() {

    const typing =
        document.getElementById(
            "typingMessage"
        );


    if (typing) {
        typing.remove();
    }
}


/* =========================================
   STATUS
========================================= */

function setStatus(
    text,
    color
) {

    if (!statusText) {
        return;
    }


    statusText.textContent =
        text;


    statusText.style.color =
        color;
}


/* =========================================
   CHAT API
========================================= */

async function askMNS(
    text
) {

    let finalMessage =
        text;


    if (
        codingMode &&
        codingMode.checked
    ) {

        finalMessage = `

حالت کدنویسی فعال است.

لطفاً در پاسخ‌های برنامه‌نویسی:
- کد را داخل code block با سه بک‌تیک قرار بده.
- زبان کد را بعد از سه بک‌تیک بنویس.
- توضیحات را بیرون از code block بنویس.
- برای کدهای طولانی، کد کامل و قابل استفاده ارائه کن.

مثال:

\`\`\`javascript
console.log("Hello");
\`\`\`

درخواست کاربر:
${text}
`;
    }


    const response =
        await fetch(
            "/api/chat",
            {
                method:
                    "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify({

                        message:
                            finalMessage,

                        history:
                            messages

                    })
            }
        );


    if (
        response.status ===
        401
    ) {

        clearSession();

        showAuthScreen();

        throw new Error(
            "نشست شما منقضی شده است. دوباره وارد شوید."
        );
    }


    if (!response.ok) {

        let errorMessage =
            "خطا در ارتباط با MNS.";


        try {

            const data =
                await response.json();


            if (data.error) {
                errorMessage =
                    data.error;
            }

        } catch (error) {}


        throw new Error(
            errorMessage
        );
    }


    const data =
        await response.json();


    if (!data.reply) {

        throw new Error(
            "پاسخی از هوش مصنوعی دریافت نشد."
        );
    }


    return data.reply;
}


/* =========================================
   IMAGE API
========================================= */

async function generateImage(
    prompt
) {

    const response =
        await fetch(
            "/api/image",
            {
                method:
                    "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify({

                        prompt:
                            prompt

                    })
            }
        );


    if (
        response.status ===
        401
    ) {

        clearSession();

        showAuthScreen();

        throw new Error(
            "نشست شما منقضی شده است. دوباره وارد شوید."
        );
    }


    if (!response.ok) {

        let errorMessage =
            "خطا در ساخت تصویر.";


        try {

            const data =
                await response.json();


            if (data.error) {
                errorMessage =
                    data.error;
            }

        } catch (error) {}


        throw new Error(
            errorMessage
        );
    }


    const data =
        await response.json();


    if (!data.image) {

        throw new Error(
            "تصویر از سرور دریافت نشد."
        );
    }


    return data.image;
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    if (
        isBusy ||
        !input
    ) {
        return;
    }


    const text =
        input.value.trim();


    if (!text) {

        input.focus();

        return;
    }


    isBusy =
        true;


    if (sendBtn) {
        sendBtn.disabled =
            true;
    }


    if (imageBtn) {
        imageBtn.disabled =
            true;
    }


    addMessage(
        text,
        "user"
    );


    input.value =
        "";


    resizeInput();


    setStatus(
        "● در حال فکر کردن...",
        "#f0c75e"
    );


    showTyping();


    try {

        const reply =
            await askMNS(
                text
            );


        removeTyping();


        addMessage(
            reply,
            "ai"
        );


        setStatus(
            "● آنلاین",
            "#63df87"
        );


    } catch (error) {

        removeTyping();


        addMessage(
            "❌ " +
            error.message,
            "ai"
        );


        setStatus(
            "● خطا",
            "#ff6b6b"
        );

    } finally {

        isBusy =
            false;


        if (sendBtn) {
            sendBtn.disabled =
                false;
        }


        if (imageBtn) {
            imageBtn.disabled =
                false;
        }


        input.focus();
    }
}


/* =========================================
   GENERATE IMAGE
========================================= */

async function generateImageFromInput() {

    if (
        isBusy ||
        !input
    ) {
        return;
    }


    const prompt =
        input.value.trim();


    if (!prompt) {

        input.focus();

        return;
    }


    isBusy =
        true;


    if (sendBtn) {
        sendBtn.disabled =
            true;
    }


    if (imageBtn) {
        imageBtn.disabled =
            true;
    }


    addMessage(
        "🎨 " + prompt,
        "user"
    );


    input.value =
        "";


    resizeInput();


    setStatus(
        "● در حال ساخت تصویر...",
        "#f0c75e"
    );


    showTyping();


    try {

        const image =
            await generateImage(
                prompt
            );


        removeTyping();


        addImageMessage(
            image,
            prompt
        );


        setStatus(
            "● آنلاین",
            "#63df87"
        );


    } catch (error) {

        removeTyping();


        let message =
            error.message || "";


        if (
            message.includes(
                "credit_balance_exhausted"
            ) ||
            message.includes(
                "no credits"
            ) ||
            message.includes(
                "insufficient_quota"
            )
        ) {

            message =
                "اعتبار API برای ساخت تصویر تمام شده است.";
        }


        addMessage(
            "❌ " + message,
            "ai"
        );


        setStatus(
            "● خطا",
            "#ff6b6b"
        );

    } finally {

        isBusy =
            false;


        if (sendBtn) {
            sendBtn.disabled =
                false;
        }


        if (imageBtn) {
            imageBtn.disabled =
                false;
        }


        input.focus();
    }
}


/* =========================================
   CLEAR
========================================= */

function clearChat() {

    const ok =
        confirm(
            "همه پیام‌های این گفتگو پاک شوند؟"
        );


    if (!ok) {
        return;
    }


    const active =
        getActiveChat();


    if (active) {

        active.messages =
            [];

        active.title =
            "گفتگوی جدید";

        active.updatedAt =
            new Date().toISOString();
    }


    messages = [];


    saveChats();

    renderChatHistory();


    if (chat) {

        chat.innerHTML =
            "";


        if (welcome) {

            welcome.style.display =
                "block";

            chat.appendChild(
                welcome
            );
        }
    }


    if (input) {

        input.value =
            "";

        resizeInput();

        input.focus();
    }


    setStatus(
        "● آنلاین",
        "#63df87"
    );
}


/* =========================================
   INPUT RESIZE
========================================= */

function resizeInput() {

    if (!input) {
        return;
    }


    input.style.height =
        "auto";


    input.style.height =
        Math.min(
            input.scrollHeight,
            140
        ) + "px";
}


/* =========================================
   THEME
========================================= */

function applyTheme(
    theme
) {

    if (
        theme === "light"
    ) {

        document.body.classList.add(
            "light"
        );

    } else {

        document.body.classList.remove(
            "light"
        );
    }
}


/* =========================================
   FONT
========================================= */

function applyFont(
    font
) {

    document.body.classList.remove(
        "font-small",
        "font-normal",
        "font-large"
    );


    document.body.classList.add(
        "font-" + font
    );
}


/* =========================================
   SETTINGS
========================================= */

function openSettings() {

    if (!settingsPanel) {
        return;
    }


    settingsPanel.classList.add(
        "show"
    );


    if (settingsBtn) {

        settingsBtn.classList.add(
            "active"
        );
    }
}


function closeSettings() {

    if (!settingsPanel) {
        return;
    }


    settingsPanel.classList.remove(
        "show"
    );


    if (settingsBtn) {

        settingsBtn.classList.remove(
            "active"
        );
    }
}


/* =========================================
   RESTORE MEMORY
========================================= */

function restoreMemory() {

    if (!chat) {
        return;
    }


    loadActiveChat();


    chat.innerHTML =
        "";


    if (!messages.length) {

        if (welcome) {

            welcome.style.display =
                "block";

            chat.appendChild(
                welcome
            );
        }

        return;
    }


    if (welcome) {

        welcome.style.display =
            "none";
    }


    messages.forEach(
        function(message) {

            if (
                !message ||
                typeof message.content !==
                    "string"
            ) {
                return;
            }


            if (
                message.content.startsWith(
                    "[IMAGE]"
                )
            ) {

                const imageUrl =
                    message.content.substring(
                        "[IMAGE]".length
                    );


                addImageMessage(
                    imageUrl,
                    "MNS AI image",
                    false
                );


                return;
            }


            addMessage(
                message.content,
                message.role === "user"
                    ? "user"
                    : "ai",
                false
            );

        }
    );
}


/* =========================================
   EVENTS
========================================= */


/* AUTH */

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        showRegisterForm
    );
}


if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLoginForm
    );
}


if (registerBtn) {

    registerBtn.addEventListener(
        "click",
        register
    );
}


if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        login
    );
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );
}


/* AUTH ENTER */

if (loginPassword) {

    loginPassword.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                login();
            }

        }
    );
}


if (registerPassword2) {

    registerPassword2.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                register();
            }

        }
    );
}


/* CHAT ENTER */

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }

        }
    );


    input.addEventListener(
        "input",
        resizeInput
    );
}


/* BUTTONS */

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );
}


if (imageBtn) {

    imageBtn.addEventListener(
        "click",
        generateImageFromInput
    );
}


if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearChat
    );
}


if (newChatBtn) {

    newChatBtn.addEventListener(
        "click",
        newChat
    );
}


/* HISTORY */

if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        openHistory
    );
}


if (closeHistoryBtn) {

    closeHistoryBtn.addEventListener(
        "click",
        closeHistory
    );
}


if (historyOverlay) {

    historyOverlay.addEventListener(
        "click",
        closeHistory
    );
}


if (historyNewChatBtn) {

    historyNewChatBtn.addEventListener(
        "click",
        newChat
    );
}


/* ESCAPE */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeHistory();

            closeSettings();
        }

    }
);


/* SUGGESTIONS */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".suggestion"
            );


        if (!button || !input) {
            return;
        }


        const text =
            button.textContent
                .trim()
                .replace(
                    /^[^\s]+\s/,
                    ""
                );


        input.value =
            text;


        resizeInput();

        input.focus();
    }
);


/* SETTINGS */

if (settingsBtn) {

    settingsBtn.addEventListener(
        "click",
        openSettings
    );
}


if (closeSettingsBtn) {

    closeSettingsBtn.addEventListener(
        "click",
        closeSettings
    );
}


if (homeBtn) {

    homeBtn.addEventListener(
        "click",
        closeSettings
    );
}


if (settingsPanel) {

    settingsPanel.addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                settingsPanel
            ) {

                closeSettings();
            }

        }
    );
}


/* THEME */

if (themeSelect) {

    themeSelect.addEventListener(
        "change",
        function() {

            applyTheme(
                themeSelect.value
            );

            saveSettings();

        }
    );
}


/* FONT */

if (fontSelect) {

    fontSelect.addEventListener(
        "change",
        function() {

            applyFont(
                fontSelect.value
            );

            saveSettings();

        }
    );
}


/* =========================================
   START
========================================= */

loadSettings();

loadMessageColor();

setupMessageColors();

setupCodingMode();

showAuthScreen();

checkLogin();