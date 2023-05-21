const express = require("express");
const app = express();
const { Pool } = require("pg");
const path = require("path");
const session = require("express-session");

const pool = new Pool({
  user: "akimabs",
  host: "localhost",
  database: "171021400238",
  password: "",
  port: 5432,
});

// Middleware
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: "ada deh",
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query = {
    text: "SELECT * FROM tbl_user WHERE username = $1 AND password = $2",
    values: [username, password],
  };

  try {
    const result = await pool.query(query);
    const user = result.rows[0];
    if (user) {
      req.session.username = username;
      res.redirect("dashboard"); // Redirect to the dashboard page
    } else {
      res.render("login", { error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

app.get("/dashboard", async (req, res) => {
  const query = "SELECT * FROM tbl_pengaduan";
  try {
    const result = await pool.query(query);
    const pengaduanData = result.rows;
    if (pengaduanData.length === 0) {
      res.render("dashboard", { pengaduanData: [] }); // Pass an empty array to indicate no records available
    } else {
      res.render("dashboard", { pengaduanData });
    }
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

app.get("/form-pengaduan", async (req, res) => {
  try {
    const kategoriQuery = "SELECT * FROM tbl_kategori";
    const kategoriResult = await pool.query(kategoriQuery);
    const kategoriData = kategoriResult.rows;

    res.render("form-pengaduan", { kategoriData });
  } catch (error) {
    res.status(500).send("Error fetching kategori data");
  }
});

app.post("/submit-pengaduan", async (req, res) => {
  const {
    jenisPengaduan,
    tanggalPengaduan,
    namaLengkap,
    jenisKelamin,
    noKtp,
    alamat,
    pengaduan,
  } = req.body;
  const username = req.session.username; // Retrieve the username from the session

  const query = {
    text: `INSERT INTO tbl_pengaduan (jenis_pengaduan, tgl_pengaduan, nm_pengadu, jenis_kelamin, no_ktp, alamat_pengadu, pengaduan, username)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    values: [
      jenisPengaduan,
      tanggalPengaduan,
      namaLengkap,
      jenisKelamin,
      noKtp,
      alamat,
      pengaduan,
      username,
    ],
  };

  try {
    await pool.query(query);
    res.redirect("/dashboard"); // Redirect back to the dashboard after form submission
  } catch (error) {
    console.error("Error submitting pengaduan:", error);
    res.status(500).send("Error submitting pengaduan");
  }
});

app.post("/delete-pengaduan/:id", async (req, res) => {
  const pengaduanId = req.params.id;

  const query = {
    text: "DELETE FROM tbl_pengaduan WHERE id_pengaduan = $1",
    values: [pengaduanId],
  };

  try {
    await pool.query(query);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error deleting pengaduan:", error);
    res.status(500).send("Error deleting pengaduan");
  }
});

// Render the edit-pengaduan page with pre-filled form for editing pengaduan entry
app.get("/edit-pengaduan/:id", async (req, res) => {
  const pengaduanId = req.params.id;

  try {
    // Retrieve the pengaduan data using the ID
    const query = {
      text: "SELECT * FROM tbl_pengaduan WHERE id_pengaduan = $1",
      values: [pengaduanId],
    };

    const result = await pool.query(query);
    const pengaduanData = result.rows[0];

    if (pengaduanData) {
      // Retrieve the kategori data
      const kategoriQuery = "SELECT * FROM tbl_kategori";
      const kategoriResult = await pool.query(kategoriQuery);
      const kategoriData = kategoriResult.rows;

      // Render the edit-pengaduan.ejs file and pass the pengaduan data and kategori data to it
      res.render("edit-pengaduan", {
        pengaduan: pengaduanData, // Pass the retrieved pengaduan data to the view
        kategoriData: kategoriData, // Pass the kategori data for populating the dropdown options
      });
    } else {
      res.status(404).send("Pengaduan not found");
    }
  } catch (error) {
    res.status(500).send("Error retrieving pengaduan data");
  }
});

app.post("/submit-edit-pengaduan/:id", async (req, res) => {
  const pengaduanId = req.params.id;
  const {
    jenisPengaduan,
    tanggalPengaduan,
    namaLengkap,
    jenisKelamin,
    noKtp,
    alamat,
    pengaduan,
  } = req.body;
  const username = req.session.username; // Retrieve the username from the session

  const query = {
    text: `UPDATE tbl_pengaduan 
           SET jenis_pengaduan = $1, tgl_pengaduan = $2, nm_pengadu = $3, jenis_kelamin = $4, no_ktp = $5, alamat_pengadu = $6, pengaduan = $7, username = $8
           WHERE id_pengaduan = $9`,
    values: [
      jenisPengaduan,
      tanggalPengaduan,
      namaLengkap,
      jenisKelamin,
      noKtp,
      alamat,
      pengaduan,
      username,
      pengaduanId,
    ],
  };

  try {
    await pool.query(query);
    res.redirect("/dashboard"); // Redirect back to the dashboard after form submission
  } catch (error) {
    console.error("Error submitting edited pengaduan:", error);
    res.status(500).send("Error submitting edited pengaduan");
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
