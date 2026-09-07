"use strict";

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT || 3000;


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.static(__dirname)
);


/* =========================================
   OPENAI
========================================= */

if (!process.env.OPENAI_API_KEY) {

    console.error(
        "❌ OPENAI_API_KEY تنظیم نشده!"
    );

    process.exit(1);
}


const client =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY
    });


/* =========================================
   MNS PERSONALITY
========================================= */

const MNS_PERSONALITY = `
تو MNS AI هستی؛ یک دستیار هوش مصنوعی واقعی که توسط محمد ساخته و توسعه داده شده است.

هویت:
- نام تو: MNS AI
- سازنده و توسعه‌دهنده: محمد
- وقتی از تو پرسیده شد چه کسی تو را ساخته، صادقانه بگو محمد تو را ساخته است.
- وانمود نکن که انسان هستی.
- درباره توانایی‌هایت صادق و دقیق باش.

رفتار:
- فارسی را روان و طبیعی صحبت کن.
- لحن دوستانه، باحال و صمیمی داشته باش، ولی بی‌احترامی نکن.
- برای سؤال ساده کوتاه جواب بده.
- برای سؤال پیچیده توضیح بیشتری بده.
- اگر چیزی را نمی‌دانی، حدس نزن.
- اطلاعات ساختگی درباره خودت، سازنده‌ات یا قابلیت‌هایت ایجاد نکن.
- در برنامه‌نویسی و ساخت بازی تا حد ممکن راهنمای عملی بده.
- اگر کاربر اشتباه کرد، محترمانه اصلاحش کن.
`;


/* =========================================
   USERS DATABASE
========================================= */

const USERS_FILE =
    path.join(
        __dirname,
        "users.json"
    );


function loadUsers() {

    try {

        if (
            !fs.existsSync(
                USERS_FILE
            )
        ) {

            fs.writeFileSync(
                USERS_FILE,
                "[]",
                "utf8"
            );

            return [];
        }


        const data =
            fs.readFileSync(
                USERS_FILE,
                "utf8"
            );


        const users =
            JSON.parse(data);


        if (
            Array.isArray(users)
        ) {

            return users;
        }


        return [];

    } catch (error) {

        console.error(
            "❌ خطا در خواندن users.json:",
            error
        );

        return [];
    }
}


function saveUsers(users) {

    try {

        fs.writeFileSync(
            USERS_FILE,
            JSON.stringify(
                users,
                null,
                2
            ),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "❌ خطا در ذخیره کاربران:",
            error
        );

        return false;
    }
}


/* =========================================
   PASSWORD HASH
========================================= */

function hashPassword(
    password
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const salt =
                crypto.randomBytes(
                    16
                ).toString("hex");


            crypto.scrypt(
                password,
                salt,
                64,
                (
                    error,
                    derivedKey
                ) => {

                    if (error) {

                        reject(
                            error
                        );

                        return;
                    }


                    resolve(
                        salt +
                        ":" +
                        derivedKey.toString(
                            "hex"
                        )
                    );

                }
            );

        }
    );
}


function verifyPassword(
    password,
    storedPassword
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            try {

                const parts =
                    storedPassword.split(
                        ":"
                    );


                if (
                    parts.length !== 2
                ) {

                    resolve(false);

                    return;
                }


                const salt =
                    parts[0];

                const storedHash =
                    Buffer.from(
                        parts[1],
                        "hex"
                    );


                crypto.scrypt(
                    password,
                    salt,
                    64,
                    (
                        error,
                        derivedKey
                    ) => {

                        if (error) {

                            reject(
                                error
                            );

                            return;
                        }


                        if (
                            derivedKey.length !==
                            storedHash.length
                        ) {

                            resolve(false);

                            return;
                        }


                        resolve(
                            crypto.timingSafeEqual(
                                derivedKey,
                                storedHash
                            )
                        );

                    }
                );

            } catch (error) {

                reject(error);
            }

        }
    );
}


/* =========================================
   SESSIONS
========================================= */

const sessions =
    new Map();


function createSession(
    username
) {

    const sessionId =
        crypto
            .randomBytes(32)
            .toString("hex");


    sessions.set(
        sessionId,
        {
            username:
                username,
            createdAt:
                Date.now()
        }
    );


    return sessionId;
}


function getSession(
    req
) {

    const sessionId =
        req.headers[
            "x-mns-session"
        ];


    if (!sessionId) {
        return null;
    }


    return (
        sessions.get(
            sessionId
        ) || null
    );
}


function requireLogin(
    req,
    res,
    next
) {

    const session =
        getSession(req);


    if (!session) {

        return res.status(401).json({
            error:
                "وارد حساب کاربری نشده‌ای."
        });
    }


    req.username =
        session.username;


    next();
}


/* =========================================
   REGISTER
========================================= */

app.post(
    "/api/register",
    async (
        req,
        res
    ) => {

        try {

            const {
                username,
                password
            } = req.body;


            const cleanUsername =
                String(
                    username || ""
                ).trim();


            const cleanPassword =
                String(
                    password || ""
                );


            if (
                !cleanUsername ||
                !cleanPassword
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "نام کاربری و رمز عبور الزامی است."

                });
            }


            if (
                cleanUsername.length <
                3
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "نام کاربری باید حداقل ۳ کاراکتر باشد."

                });
            }


            if (
                cleanUsername.length >
                30
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد."

                });
            }


            if (
                cleanPassword.length <
                6
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "رمز عبور باید حداقل ۶ کاراکتر باشد."

                });
            }


            if (
                cleanPassword.length >
                200
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "رمز عبور بیش از حد طولانی است."

                });
            }


            /*
             * فقط حروف انگلیسی،
             * عدد، _ و -
             */

            if (
                !/^[a-zA-Z0-9_-]+$/.test(
                    cleanUsername
                )
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، _ و - باشد."

                });
            }


            const users =
                loadUsers();


            const usernameExists =
                users.some(
                    user =>
                        user.username
                            .toLowerCase() ===
                        cleanUsername
                            .toLowerCase()
                );


            if (
                usernameExists
            ) {

                return res.status(
                    409
                ).json({

                    error:
                        "این نام کاربری قبلاً ثبت شده است."

                });
            }


            const passwordHash =
                await hashPassword(
                    cleanPassword
                );


            const newUser = {

                id:
                    crypto
                        .randomUUID(),

                username:
                    cleanUsername,

                passwordHash:
                    passwordHash,

                createdAt:
                    new Date().toISOString()

            };


            users.push(
                newUser
            );


            const saved =
                saveUsers(
                    users
                );


            if (!saved) {

                return res.status(
                    500
                ).json({

                    error:
                        "ذخیره حساب انجام نشد."

                });
            }


            const sessionId =
                createSession(
                    cleanUsername
                );


            res.json({

                success:
                    true,

                user: {

                    id:
                        newUser.id,

                    username:
                        newUser.username

                },

                sessionId:
                    sessionId

            });


        } catch (error) {

            console.error(
                "Register Error:",
                error
            );


            res.status(
                500
            ).json({

                error:
                    "خطا در ساخت حساب."

            });
        }

    }
);


/* =========================================
   LOGIN
========================================= */

app.post(
    "/api/login",
    async (
        req,
        res
    ) => {

        try {

            const {
                username,
                password
            } = req.body;


            const cleanUsername =
                String(
                    username || ""
                ).trim();


            const cleanPassword =
                String(
                    password || ""
                );


            if (
                !cleanUsername ||
                !cleanPassword
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "نام کاربری و رمز عبور را وارد کن."

                });
            }


            const users =
                loadUsers();


            const user =
                users.find(
                    item =>
                        item.username
                            .toLowerCase() ===
                        cleanUsername
                            .toLowerCase()
                );


            if (!user) {

                return res.status(
                    401
                ).json({

                    error:
                        "نام کاربری یا رمز عبور اشتباه است."

                });
            }


            const valid =
                await verifyPassword(
                    cleanPassword,
                    user.passwordHash
                );


            if (!valid) {

                return res.status(
                    401
                ).json({

                    error:
                        "نام کاربری یا رمز عبور اشتباه است."

                });
            }


            const sessionId =
                createSession(
                    user.username
                );


            res.json({

                success:
                    true,

                user: {

                    id:
                        user.id,

                    username:
                        user.username

                },

                sessionId:
                    sessionId

            });


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            res.status(
                500
            ).json({

                error:
                    "خطا در ورود به حساب."

            });
        }

    }
);


/* =========================================
   CURRENT USER
========================================= */

app.get(
    "/api/me",
    (
        req,
        res
    ) => {

        const session =
            getSession(req);


        if (!session) {

            return res.status(
                401
            ).json({

                loggedIn:
                    false

            });
        }


        const users =
            loadUsers();


        const user =
            users.find(
                item =>
                    item.username ===
                    session.username
            );


        if (!user) {

            return res.status(
                401
            ).json({

                loggedIn:
                    false

            });
        }


        res.json({

            loggedIn:
                true,

            user: {

                id:
                    user.id,

                username:
                    user.username

            }

        });
    }
);


/* =========================================
   LOGOUT
========================================= */

app.post(
    "/api/logout",
    (
        req,
        res
    ) => {

        const sessionId =
            req.headers[
                "x-mns-session"
            ];


        if (sessionId) {

            sessions.delete(
                sessionId
            );
        }


        res.json({

            success:
                true

        });
    }
);


/* =========================================
   CHAT
========================================= */

app.post(
    "/api/chat",
    requireLogin,
    async (
        req,
        res
    ) => {

        try {

            const {
                message,
                history = []
            } = req.body;


            if (
                !message ||
                !String(
                    message
                ).trim()
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "پیام خالی است."

                });
            }


            const safeHistory =
                Array.isArray(
                    history
                )

                    ? history
                        .filter(
                            m =>
                                m &&
                                (
                                    m.role ===
                                    "user" ||
                                    m.role ===
                                    "assistant"
                                )
                        )
                        .slice(-20)
                        .map(
                            m => ({

                                role:
                                    m.role,

                                content:
                                    String(
                                        m.content ||
                                        ""
                                    )

                            })
                        )

                    : [];


            const response =
                await client.responses.create({

                    model:
                        "gpt-5.6-luna",

                    instructions:
                        MNS_PERSONALITY,

                    input: [

                        ...safeHistory,

                        {

                            role:
                                "user",

                            content:
                                String(
                                    message
                                ).trim()

                        }

                    ]

                });


            res.json({

                reply:
                    response.output_text

            });


        } catch (error) {

            console.error(
                "OpenAI Chat Error:",
                error
            );


            res.status(
                500
            ).json({

                error:
                    "خطا در ارتباط با هوش مصنوعی."

            });
        }

    }
);


/* =========================================
   IMAGE GENERATION
========================================= */

app.post(
    "/api/image",
    requireLogin,
    async (
        req,
        res
    ) => {

        try {

            const {
                prompt
            } = req.body;


            if (
                !prompt ||
                !String(
                    prompt
                ).trim()
            ) {

                return res.status(
                    400
                ).json({

                    error:
                        "توضیح تصویر خالی است."

                });
            }


            const result =
                await client.images.generate({

                    model:
                        "gpt-image-2",

                    prompt:
                        String(
                            prompt
                        ).trim(),

                    size:
                        "1024x1024"

                });


            const image =
                result.data?.[0];


            if (!image) {

                throw new Error(
                    "تصویر تولید نشد."
                );
            }


            if (
                image.b64_json
            ) {

                return res.json({

                    image:
                        `data:image/png;base64,${image.b64_json}`

                });
            }


            if (
                image.url
            ) {

                return res.json({

                    image:
                        image.url

                });
            }


            throw new Error(
                "فرمت تصویر دریافتی نامعتبر است."
            );


        } catch (error) {

            console.error(
                "========== IMAGE ERROR =========="
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Status:",
                error.status
            );

            console.error(
                "Code:",
                error.code
            );

            console.error(
                "Type:",
                error.type
            );

            console.error(
                "Full error:",
                error
            );

            console.error(
                "================================="
            );


            res.status(
                500
            ).json({

                error:
                    error.message ||
                    "خطا در ساخت تصویر."

            });
        }

    }
);


/* =========================================
   SERVER
========================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "🤖 MNS AI آماده است!"
        );

        console.log(
            `🌐 http://127.0.0.1:${PORT}`
        );

        console.log(
            "👤 سیستم حساب کاربری فعال است."
        );

        console.log(
            `📁 کاربران: ${USERS_FILE}`
        );

    }
);