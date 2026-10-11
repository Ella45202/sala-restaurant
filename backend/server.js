require("dotenv").config();

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// ========================================
// SALA RESTAURANT BACKEND
// ========================================

const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();

const path = require("path");

const PORT = process.env.PORT || 3000;

// Serve website images from the images folder
app.use(
    "/images",
    express.static(path.join(__dirname, "..", "images"))
  );

console.log("Server folder:", __dirname);
console.log(
  "Images folder:",
  path.join(__dirname, "images")
);

app.use(express.static(path.join(__dirname, "..")));


const fs = require("fs");

console.log(
    "Project folder:",
    path.join(__dirname, "..")
);

console.log(
    "Pages folder exists:",
    fs.existsSync(path.join(__dirname, "..", "pages"))
);

console.log(
    "Menu file exists:",
    fs.existsSync(path.join(__dirname, "..", "pages", "menu.html"))
);


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// MENU DATA
// ========================================

const menu = [

    {
        id: 1,
        name: "Charred River Prawns",
        category: "starters",
        description: "Tamarind glaze · crispy shallots",
        price: 420,
        image: "prawns.jpg"
    },

    {
        id: 2,
        name: "Tom Yum River Prawns",
        category: "starters",
        description: "Spicy broth · lemongrass · lime",
        price: 380,
        image: "tom-yan-prawns.jpg"
    },

    {
        id: 3,
        name: "SALA Green Curry",
        category: "mains",
        description: "Slow-cooked beef · coconut · Thai basil",
        price: 480,
        image: "curry.jpg"
    },

    {
        id: 4,
        name: "Massaman Short Rib",
        category: "mains",
        description: "Braised beef · roasted peanuts · potatoes",
        price: 520,
        image: "massaman-short-rib.jpg"
    },

    {
        id: 5,
        name: "Mango Sticky Rice",
        category: "desserts",
        description: "Nam Dok Mai mango · coconut cream",
        price: 220,
        image: "mango.jpg"
    },

    {
        id: 6,
        name: "Thai Tea Crème Brûlée",
        category: "desserts",
        description: "Thai tea custard · caramelized sugar",
        price: 240,
        image: "thai-tea-creme-brulee.jpg"
    }

];


// ========================================
// HOME API
// ========================================

app.get("/api", (req, res) => {

    res.json({

        message: "Welcome to SALA API",

        status: "success"

    });

});


// ========================================
// MENU API
// ========================================

app.get("/api/menu", (req, res) => {

    res.json({

        status: "success",

        count: menu.length,

        data: menu

    });

});



/* ========================================
   CREATE RESERVATION
======================================== */

app.post("/api/reservations", (req, res) => {
    const { date, time, guests } = req.body;

    // VALIDATION
    if (!date || !time || !guests) {
        return res.status(400).json({
            status: "error",
            message: "Please provide date, time, and number of guests."
        });
    }

    const sql = `
        INSERT INTO reservations
        (date, time, guests)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [date, time, guests], async (error, result) => {
        if (error) {
            console.error("Reservation database error:", error);

            return res.status(500).json({
                status: "error",
                message: "Failed to save reservation."
            });
        }

        const reservation = {
            id: result.insertId,
            date: date,
            time: time,
            guests: Number(guests)
        };

        // SEND RESTAURANT EMAIL NOTIFICATION
        console.log("Starting reservation email notification...");

        try {
            const emailResult = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL,
                to: process.env.CONTACT_NOTIFICATION_EMAIL,
                subject: "New SALA Table Reservation",
                text: [
                    "A new reservation has been made at SALA.",
                    "",
                    `Reservation ID: ${reservation.id}`,
                    `Date: ${reservation.date}`,
                    `Time: ${reservation.time}`,
                    `Number of guests: ${reservation.guests}`,
                    "",
                    "Please check your reservation records."
                ].join("\n")
            });

            if (emailResult.error) {
                console.error(
                    "Reservation email failed:",
                    emailResult.error
                );
            } else {
                console.log("Reservation notification email sent!");
            }
        } catch (emailError) {
            console.error(
                "Reservation email error:",
                emailError
            );
        }

        // RETURN SUCCESS TO CUSTOMER
        return res.status(201).json({
            status: "success",
            message: "Reservation created successfully.",
            data: reservation
        });
    });
});



// ========================================
// GET ALL RESERVATIONS
// ========================================

app.get("/api/reservations", (req, res) => {

    const sql = `
        SELECT
            id,
            date,
            time,
            guests,
            created_at
        FROM reservations
        ORDER BY created_at DESC
    `;


    db.query(
        sql,
        (error, results) => {

            if (error) {

                console.error(
                    "Reservation database error:",
                    error
                );

                return res.status(500).json({

                    status: "error",

                    message:
                        "Failed to load reservations."

                });

            }


            res.json({

                status: "success",

                count: results.length,

                data: results

            });

        }

    );

});


/* ========================================
   CREATE CONTACT MESSAGE
======================================== */

console.log("SALA CONTACT ROUTE HIT");
app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    if (
        !name?.trim() ||
        !email?.trim() ||
        !subject?.trim() ||
        !message?.trim()
    ) {
        return res.status(400).json({
            status: "error",
            message: "Please fill in all fields."
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
            status: "error",
            message: "Please enter a valid email address."
        });
    }


if (
    name.trim().length > 100 ||
    email.trim().length > 254 ||
    subject.trim().length > 150 ||
    message.trim().length > 5000
) {
    return res.status(400).json({
        status: "error",
        message: "Some fields are too long. Please shorten your message and try again."
    });
}


    const sql = `
        INSERT INTO contact_messages
        (name, email, subject, message)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name.trim(),
            email.trim(),
            subject.trim(),
            message.trim()
        ],
        async (error, result) => {
            if (error) {
                console.error("Contact database error:", error);

                return res.status(500).json({
                    status: "error",
                    message: "Failed to save your message."
                });
            }

            // The message is saved. Now try sending the email.
            console.log("Starting SALA email notification...");
            try {
                const emailResult = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL,
                    to: process.env.CONTACT_NOTIFICATION_EMAIL,
                    replyTo: email.trim(),
                    subject: `New SALA Contact Message: ${subject.trim()}`,
                    text: [
                        "You received a new message through the SALA contact form.",
                        "",
                        `Name: ${name.trim()}`,
                        `Email: ${email.trim()}`,
                        `Subject: ${subject.trim()}`,
                        "",
                        "Message:",
                        message.trim()
                    ].join("\n")
                });

                if (emailResult.error) {
                    console.error(
                        "Email notification failed:",
                        emailResult.error
                    );
                } else {
                    console.log("Contact notification email sent!");
                }
            } catch (emailError) {
                console.error(
                    "Email notification error:",
                    emailError
                );
            }

            return res.status(201).json({
                status: "success",
                message: "Thank you for contacting SALA! Your message has been received.",
                data: {
                    id: result.insertId
                }
            });
        }
    );
});



// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `SALA server is running on http://localhost:${PORT}`
    );

});
