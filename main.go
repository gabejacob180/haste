package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
	gomail "gopkg.in/mail.v2"
)

var ctx context.Context
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Struct for mail function
type mail struct {
	address string
	subject string
	body string
	token string
}

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

// Generate a JWT token for email verification
func generateToken(email string, password string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"password": password,
		"exp":   time.Now().Add(30 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// Send verification email
func sendEmail(email mail) (error){
	
	// Create a new message
	message := gomail.NewMessage()
	
	// Set email headers
	message.SetHeader("From", "gabejacob180@gmail.com")
	message.SetHeader("To", email.address)
	message.SetHeader("Subject", email.subject)

	verificationLink:= ""
	if email.token != ""{
		verificationLink = fmt.Sprintf("%s/api/auth/verify?token=%s", os.Getenv("HOST_ADDRESS"), email.token)
	}
	// Set email body
	message.SetBody("text/plain", fmt.Sprintf(email.body, verificationLink))

	// Set up the SMTP dialer
	dialer := gomail.NewDialer("smtp.gmail.com", 587, "gabejacob180@gmail.com", os.Getenv("GMAIL_APP_PW"))

	// Send the email
	err := dialer.DialAndSend(message)
	if err == nil {
		fmt.Println("Email sent successfully!")
	}

	return err
}

// Handles route for login, checking whether verified user already exists in database, if so, returning 409 response,
// else, adding new row to users db with unverified status and sending verification email to provided address
func apiHandler(w http.ResponseWriter, r *http.Request) {
	// Create a Context with a timeout
	queryCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Connect to database
	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@/%s", os.Getenv("DB_USER"), os.Getenv("DB_PW"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Can't open database connection", http.StatusInternalServerError)
		log.Print("Can't open database connection, " , err)
	}
	
	// Test database connection
	if err := db.PingContext(queryCtx); err != nil {
		http.Error(w, "Can't ping db", http.StatusInternalServerError)
		log.Print("Can't ping db, " , err)
	}
	
	// Check request body
	var bodyString string
	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Can't read body", http.StatusInternalServerError)
			log.Print("Can't read body, " , err)
		}
		
		// Convert body bytes to string
		bodyString = string(bodyBytes)
	}
	
	// Send query to database, checking if user exists
	var verified bool
	var password string
	checkEmail := bodyString[strings.IndexRune(bodyString, '=') + 1: strings.LastIndex(bodyString, "&")]
	checkPassword := bodyString[strings.LastIndex(bodyString, "=") + 1:]
	err = db.QueryRowContext(queryCtx, "SELECT password,verified FROM users WHERE email = ?;", checkEmail).Scan(&password, &verified)
	
	switch {
	// If there is no matching user, add new row to database with unverified status and send verification email
	case err == sql.ErrNoRows:
		// Add new row with unverified status to database
		log.Printf("no user with email %s\n", checkEmail)
		_, err := db.ExecContext(
			queryCtx,
			"INSERT INTO users(email, password, verified) VALUES (?, ?, ?);",
			checkEmail,
			checkPassword,
			"0",
		)
		if err != nil {
			http.Error(w, "Can't add user to db", http.StatusInternalServerError)
			log.Print("Can't add user to db, " , err)
		}
		
		// Generate JWT, given email and password
		token, err := generateToken(checkEmail, checkPassword)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			log.Print("Failed to generate token, " , err)
		}
		
		// Send verification email with generated token
		message := mail{address: checkEmail, subject: "haste Verification", body: "Hi,\n\nPlease verify your email by clicking the link below:\n%s\n\nThis link will expire in 30 minutes.", token: token}
		err = sendEmail(message)
		if err != nil {
			http.Error(w, "Failed to send email", http.StatusNotAcceptable)
			log.Print("Failed to send email, " , err)
		}

		log.Print("Successfully sent verification email")
		db.Close()
		enableCors(w)
		w.WriteHeader(http.StatusOK)
		
	// If there is an error, throw
	case err != nil:
			http.Error(w, "Can't check if user already exists", http.StatusInternalServerError)
			log.Print("Can't check if user already exists: ")
			log.Fatal(err)

	// If there is a matching user, check if it's verified, if so, return 409 code, if not, continue verification process
	default:
		if verified {
			http.Error(w, "User already exists", http.StatusConflict)
			log.Print("User already exists")	
		
		// If user isn't verified, check if new password is different from previous, if so, update field and send verification email
		} else {
			if password != checkPassword{
				_, err = db.ExecContext(queryCtx, "UPDATE users SET password = ? WHERE email = ?;", checkPassword, checkEmail)
				if err != nil {
					http.Error(w, "Can't update database", http.StatusInternalServerError)
					log.Print("Can't update database")
					log.Fatal(err)
				}
			}

			// Generate JWT, given email and password
			token, err := generateToken(checkEmail, checkPassword)
			if err != nil {
				http.Error(w, "Failed to generate token", http.StatusInternalServerError)
				log.Print("Failed to generate token")
				log.Fatal(err)
			}
			
			// Send verification email with generated token
			message := mail{address: checkEmail, subject: "haste Verification", body: "Hi,\n\nPlease verify your email by clicking the link below:\n%s\n\nThis link will expire in 30 minutes.", token: token}
			err = sendEmail(message)
			if err != nil {
				http.Error(w, "Failed to send email", http.StatusNotAcceptable)
				log.Print("Failed to send email")
				log.Fatal(err)
			}
			log.Print("Successfully sent verification email")
			db.Close()
			enableCors(w)
			w.WriteHeader(http.StatusOK)
		}
	}
}

// Email verification handler checking JWT token and updating verified status of corresponding user
func verifyHandler(w http.ResponseWriter, r *http.Request) {
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		log.Print("Missing token")
		return
	}

	// Parse and validate the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return jwtSecret, nil
	})

	// Throw error if token isn't valid
	if err != nil || !token.Valid {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		log.Print("Invalid or expired token")
		return
	}

	// Check token against secret
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Send confirmation email
	email := claims["email"].(string)
	message := mail{address: email, subject: "Successful verification", body: "Hi,\n\nAccount successfully verified.%s", token: ""}
	err = sendEmail(message)
	if err != nil {
		http.Error(w, "Failed to send confirmation email", http.StatusBadGateway)
		log.Print("Failed to send confirmation email")
		log.Fatal(err)
	}

	// Create a Context with a timeout
	queryCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Connect to database
	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@/%s", os.Getenv("DB_USER"), os.Getenv("DB_PW"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Can't open database connection", http.StatusInternalServerError)
		log.Print("Can't open database connection")
		log.Fatal(err)
	}

	// Test database connection
	if err := db.PingContext(queryCtx); err != nil {
		http.Error(w, "Can't ping db", http.StatusInternalServerError)
		log.Print("Can't ping db")
		log.Fatal(err)
	}

	// Send query to database, setting user's status to verified
	_, err = db.ExecContext(queryCtx, "UPDATE users SET verified = 1 WHERE email = ?;", email)
	if err != nil {
		http.Error(w, "Can't update verification status", http.StatusInternalServerError)
		log.Print("Can't update verification status")
		log.Fatal(err)
	}

	log.Printf("Successfully verified %s", email)
	db.Close()
	enableCors(w)
	http.Redirect(w, r, "/", http.StatusMovedPermanently)
}

func pingHandler(w http.ResponseWriter, r *http.Request) {
	// Create a Context with a timeout
	queryCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Connect to database
	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@/%s", os.Getenv("DB_USER"), os.Getenv("DB_PW"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Can't open database connection", http.StatusInternalServerError)
		log.Print("Can't open database connection")
		log.Fatal(err)
	}
	
	// Test database connection
	if err := db.PingContext(queryCtx); err != nil {
		http.Error(w, "Can't ping db", http.StatusInternalServerError)
		log.Print("Can't ping db")
		log.Fatal(err)
	}
	
	var bodyString string
	// Check request body
	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Can't read body", http.StatusInternalServerError)
			log.Print("Can't read body")
			log.Fatal(err)
		}
		
		// Convert body bytes to string
		bodyString = string(bodyBytes)
	}
	
	// Send query to database, checking if user is verified
	var verified bool
	checkEmail := bodyString[strings.IndexRune(bodyString, '=') + 1:]
	err = db.QueryRowContext(queryCtx, "SELECT verified FROM users WHERE email = ?;", checkEmail).Scan(&verified)
	switch{
	case err == sql.ErrNoRows: 
		http.Error(w, "User is not found", http.StatusNotFound)
		log.Print("Can't read body")
		log.Fatal(err)

	case err != nil:
		http.Error(w, "Can't check verification status", http.StatusInternalServerError)
		log.Print("Can't check verification status")
		log.Fatal(err)

	default:
		db.Close()
		enableCors(w)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(fmt.Sprintf("{\"verified\":\"%t\"}", verified))
	}
}

// func sessionLogin(w http.ResponseWriter, r *http.Request) {
// 	// Get the ID token sent by the client
// 	defer r.Body.Close()
// 	idToken, err := getIDTokenFromBody(r)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	decoded, err := client.VerifyIDToken(r.Context(), idToken)
// 	if err != nil {
// 		http.Error(w, "Invalid ID token", http.StatusUnauthorized)
// 		return
// 	}
// 	// Return error if the sign-in is older than 5 minutes.
// 	if time.Now().Unix()-decoded.Claims["auth_time"].(int64) > 5*60 {
// 		http.Error(w, "Recent sign-in required", http.StatusUnauthorized)
// 		return
// 	}

// 	expiresIn := time.Hour * 24 * 5
// 	cookie, err := client.SessionCookie(r.Context(), idToken, expiresIn)
// 	if err != nil {
// 		http.Error(w, "Failed to create a session cookie", http.StatusInternalServerError)
// 		return
// 	}
// 	http.SetCookie(w, &http.Cookie{
// 		Name:     "session",
// 		Value:    cookie,
// 		MaxAge:   int(expiresIn.Seconds()),
// 		HttpOnly: true,
// 		Secure:   true,
// 	})
// 	w.Write([]byte(`{"status": "success"}`))
// }

func main() {
	// Load .env variables
	err := godotenv.Load(".env")
  if err != nil {
    log.Fatal("Error loading .env file")
  }

	mux := http.NewServeMux()
	mux.HandleFunc("/api/auth/login", apiHandler)
	mux.HandleFunc("/api/auth/verify", verifyHandler)
	mux.HandleFunc("/api/auth/ping", pingHandler)
	// mux.HandleFunc("/api/auth/sessionLogin", sessionLogin)
	log.Print("Listening...")
	log.Fatal(http.ListenAndServe(":3001", mux))
}