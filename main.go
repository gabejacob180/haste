package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

var ctx context.Context
var client *auth.Client

func enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Csrf-Token")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

func getIDTokenFromBody(r *http.Request) (string, error) {
    var body struct {
        IDToken string `json:"idToken"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        return "", fmt.Errorf("invalid request body: %w", err)
    }
    if body.IDToken == "" {
        return "", fmt.Errorf("missing idToken field")
    }
	log.Print("ID: " + body.IDToken)
    return body.IDToken, nil
}

func sessionLogin(w http.ResponseWriter, r *http.Request) {
	// Handle preflight request instantly
	if r.Method == "OPTIONS" {
		enableCors(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}
	
	// Get the ID token sent by the client
	defer r.Body.Close()
	idToken, err := getIDTokenFromBody(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	decoded, err := client.VerifyIDToken(r.Context(), idToken)
	if err != nil {
		http.Error(w, "Invalid ID token", http.StatusUnauthorized)
		return
	}

	authTime, ok := decoded.Claims["auth_time"].(float64)
	if !ok {
		http.Error(w, "Invalid auth_time claim", http.StatusUnauthorized)
		return
	}

	if time.Now().Unix()-int64(authTime) > 5*60 {
		http.Error(w, "Recent sign-in required", http.StatusUnauthorized)
		return
	}
	log.Print("Here")

	expiresIn := time.Hour * 24 * 5
	cookie, err := client.SessionCookie(r.Context(), idToken, expiresIn)
	if err != nil {
		http.Error(w, "Failed to create a session cookie", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    cookie,
		MaxAge:   int(expiresIn.Seconds()),
		HttpOnly: true,
		Secure:   true,
		Path: "/",
		SameSite: http.SameSiteLaxMode,
	})
	enableCors(w)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "success"}`))
}

func main() {
	// Load .env variables
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	app, err := firebase.NewApp(ctx, nil, option.WithAuthCredentialsFile(option.ServiceAccount, "public/haste-c1520-firebase-adminsdk-fbsvc-1f89ec9598.json"))
	if err != nil {
		log.Fatalf("error initializing app: %v", err)
	}
	
	client, err = app.Auth(ctx)
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/auth/sessionLogin", sessionLogin)
	log.Print("Listening...")
	log.Fatal(http.ListenAndServe(":3001", mux))
}