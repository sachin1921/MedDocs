const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'healthcarerec'
});

connection.on('error', (err) => {
	console.log("connection error: ", err);
})

app.get("/hospitals", (req, res) => {
	const queryString = "SELECT * FROM hospital";
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/hospitals/location/:location", (req, res) => {
	const queryString =  `SELECT *
						  FROM hospital
						  WHERE Hospital_Address = ANY
						  (SELECT h.Hospital_Address
						   FROM hospital h
						   WHERE h.Hospital_Address LIKE '%${req.params.location}%')`;
	connection.query(queryString,(err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/doctors", (req, res) => {
	const queryString = "SELECT * FROM doctor";
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/hospital/:id/doctors", (req, res) => {
	const queryString = `SELECT * 
						 FROM doctor
						 WHERE Hospital_ID=?`;
	connection.query(queryString, [req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/doctor/:id/patients", (req, res) => {
	const queryString = `(SELECT * 
						  FROM healthcarerec.patient p
						  WHERE p.Primary_Doc_ID=?) 
						  UNION 
						  (SELECT p.*
						  FROM healthcarerec.visit v, healthcarerec.patient p
						  WHERE v.V_Pat_ID=p.Pat_ID AND v.V_Doc_ID=?);`;
	connection.query(queryString, [req.params.id, req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);

		}
	});
});

app.get("/doctor/:id/patients/blood/:blood", (req, res) => {
	const queryString = `SELECT *
						 FROM ((SELECT * 
						 FROM healthcarerec.patient p
						 WHERE p.Primary_Doc_ID=?) 
						 UNION 
						 (SELECT p.*
						 FROM healthcarerec.visit v, healthcarerec.patient p
						 WHERE v.V_Pat_ID=p.Pat_ID AND v.V_Doc_ID=?)) AS f
						 WHERE f.Blood_Grp=?;`;
	connection.query(queryString, [req.params.id, req.params.id, req.params.blood], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);

		}
	});
});

app.get("/hospital/:id/doctors/specialty/:specialty", (req, res) => {
	const queryString = `SELECT * 
						 FROM doctor
	    				 WHERE Hospital_ID=? AND Speciality=?`
	connection.query(queryString, [req.params.id, req.params.specialty], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/doctors/specialties", (req, res) => {
	const queryString = "SELECT DISTINCT Speciality FROM doctor;";
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});


app.get("/doctors/:id", (req, res) => {
	console.log(req.params.id);
	const queryString = "SELECT * FROM doctor WHERE Doc_ID=?";
	connection.query(queryString, [req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/doctors/:id/visits", (req, res) => {
	const queryString = "SELECT * FROM visit WHERE Doctor_id=?";
	connection.query(queryString,[req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/doctors/:id/patients", (req, res) => {
	const queryString = `SELECT p.* 
						 FROM patient p, visit v 
	    			     WHERE p.Id=v.Patient_id && v.Doctor_id=?`;
	connection.query(queryString,[req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/patients", (req, res) => {
	const queryString = "SELECT * FROM patient";
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/patients/:id", (req, res) => {
	console.log(req.params.id);
	const queryString = "SELECT * FROM patient WHERE Pat_ID=?";
	connection.query(queryString, [req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/visits", (req, res) => {
	const queryString = "SELECT * FROM visit";
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});


app.post("/patients/new", (req,res) => {
	const fname = req.body.fname;
	const lname = req.body.lname;
	const image = req.body.image;
	const gender = req.body.gender;
	const dob = req.body.dob;
	const age = parseInt(req.body.age);
	const phone = parseFloat(req.body.phone);
	const address = req.body.address;
	const email = req.body.email;
	const password = req.body.password;
	const healthcard = req.body.healthcard;
	const emergencyName = req.body.emergencyName;
	const emergencyContact = req.body.emergencyContact;
	const primaryDoc = parseInt(req.body.primaryDoc);
	const bloodGroup = req.body.bloodGroup;
	const queryString = `INSERT INTO \`healthcarerec\`.\`patient\` (\`Pat_F_Name\`, \`Pat_L_Name\`, \`Profile_IMG\`,\`Gender\`, \`DOB\`, \`Age\`, \`Phone_No\`, \`Pat_Address\`, \`Email\`, \`Password\`, \`HealthCard_Num\`, \`Emerg_Name\`, \`Emerg_Contact\`, \`Primary_Doc_ID\`, \`Blood_Grp\`) VALUES ('${fname}', '${lname}', '${image}','${gender}', '${dob}', '${age}', '${phone}', '${address}', '${email}', '${password}', '${healthcard}', '${emergencyName}', '${emergencyContact}', '${primaryDoc}', '${bloodGroup}');`;
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			res.send({error: err});
		} else {
			// console.log(JSON.parse(rows));
			if(rows.length > 0) {
				// const user = {
				// 	Doctor_id: rows[0].Doctor_id,
				// 	Fname: rows[0].Fname,
				// 	Specialty: rows[0].Speciality,
				// 	email: rows[0].Email,
				// }
				res.json(rows[0]);
			} else {
				res.json({});
			}
		}

	});
});

app.post("/visits/new", (req,res) => {
	const patientId = parseInt(req.body.patientId);
	const doctorId = parseInt(req.body.doctorId);
	const hospitalId = parseInt(req.body.hospitalId);
	const date = req.body.date;
	const bodyTemp = parseInt(req.body.bodyTemp);
	const heartRate = parseInt(req.body.heartRate);
	const height = parseInt(req.body.height);
	const weight = parseInt(req.body.weight);
	const notes = req.body.notes;
	const pdf = req.body.pdf;
	const queryString = `INSERT INTO \`healthcarerec\`.\`visit\` (\`V_Pat_ID\`, \`V_Doc_ID\`, \`V_Visit_Date\`, \`V_Location\`, \`Height\`, \`Weight\`, \`Notes\`, \`Body_Temp\`, \`Heart_Rate\`, \`PDF\`) VALUES ('${patientId}', '${doctorId}', '${date}', '${hospitalId}', '${height}', '${weight}', '${notes}', '${bodyTemp}', '${heartRate}', '${pdf}');`;
	connection.query(queryString, (err, rows, fields) => {
		if (err) {
			res.send({error: err});
		} else {
			// console.log(JSON.parse(rows));
			if(rows.length > 0) {
				// const user = {
				// 	Doctor_id: rows[0].Doctor_id,
				// 	Fname: rows[0].Fname,
				// 	Specialty: rows[0].Speciality,
				// 	email: rows[0].Email,
				// }
				res.json(rows[0]);
			} else {
				res.json({});
			}
		}

	});
});


app.get("/visits/patient/:id", (req, res) => {
	const queryString = `SELECT v.*, d.Doc_F_Name, d.Doc_L_Name, h.Hospital_Name
	FROM visit v, doctor d, hospital h
	WHERE d.Doc_ID=v.V_Doc_ID AND h.Hospital_ID=v.V_Location
	AND v.V_Pat_ID=?
	ORDER BY v.V_Visit_Date DESC`;
	connection.query(queryString, [req.params.id], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.get("/visits/:date/patients", (req, res) => {
	console.log(req.params.date);
	const queryString = `SELECT visit.Visit_date, patient.Fname, patient.Lname, doctor.DFname, doctor.DLname
	FROM patient, visit, doctor
	WHERE visit.Patient_id=patient.Id AND visit.Doctor_id = doctor.Doctor_id AND visit.Visit_date=?`;
	connection.query(queryString,[req.params.date], (err, rows, fields) => {
		if (err) {
			console.log("failed to query: " + err);
			res.end();
			return;
		} else {
			res.json(rows);
		}
	});
});

app.listen(3003, () => {
	console.log("server running on port 3003"); 
});

app.post("/api/logindoctor", (req,res) => {
	const email = req.body.email;
	const password = req.body.password;
	// check if user with email and pass exist in database
	const queryString = "SELECT * FROM doctor WHERE Email=? AND Password=?;";
	connection.query(queryString, [email, password], (err, rows, fields) => {
		if (err) {
			res.send({error: err});
		} else {
			// console.log(JSON.parse(rows));
			if(rows.length > 0) {
				// const user = {
				// 	Doctor_id: rows[0].Doctor_id,
				// 	Fname: rows[0].Fname,
				// 	Specialty: rows[0].Speciality,
				// 	email: rows[0].Email,
				// }
				res.json(rows[0]);
			} else {
				res.json({});
			}
		}

	});
});

// app.post("/api/loginpatient", (req,res) => {
// 	const email = req.body.email;
// 	const password = req.body.password;

// 	// check if user with email and pass exist in database
// 	const queryString = "SELECT * FROM patients WHERE email=? AND password=?;";
// 	connection.query(queryString, [email, password], (err, rows, fields) => {
// 		if (err) {
// 			console.log("failed to query: " + err);
// 		} else {
// 			res.json(rows);
// 		}
// 	});
// });
