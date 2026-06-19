package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"os"
	"slices"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

var ctx context.Context
var client *auth.Client

var allowedOrigins = []string{
	"http://localhost:3000",
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Check if the requested origin is allowed
		if slices.Contains(allowedOrigins, origin) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Csrf-Token")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Helper function to extract api key from request header
func extractToken(r *http.Request) string {
	// Get the Raw Header value
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	// Split the header to ensure it starts with "Bearer"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}

	return parts[1]
}

// Helper function to extract firebase ID token from request body
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
    return body.IDToken, nil
}

// Route once page is rendered to pass CSRF token for potential login
func servePage(w http.ResponseWriter, r *http.Request) {
	id := uuid.New()
	csrfToken := hex.EncodeToString(id[:])
	log.Print("csrfToken: " + csrfToken)
	w.Header().Set("Content-Type", "application/json")
	// enableCors(w)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
        "csrfToken":   csrfToken,
    })
}

func sessionLogin(w http.ResponseWriter, r *http.Request) {
	log.Print("New cookie request")

	requestDump, err := httputil.DumpRequest(r, true)
    if err != nil {
        fmt.Println("Error dumping request:", err)
        return
    }
    fmt.Println(string(requestDump))
	// If csrf token is not the same in the header as in the token, return 401
	csrfTokenCookie, err := r.Cookie("csrfToken")
    if err != nil || csrfTokenCookie == nil {
		// log.Print("Cannot get cookie")
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

	if r.Header.Get("X-CSRF-Token") != csrfTokenCookie.Value {
		// fmt.Printf("Cannot compare csrf token: %s, %v\n", r.Header.Get("X-Csrf-Token"), csrfTokenCookie.Value)
		http.Error(w, "Unauthorized: Invalid CSRF token", http.StatusUnauthorized)
		return
	}

	// If API key is incorrect, return 400
	api_key := extractToken(r)
	if api_key != os.Getenv("BACKEND_API_KEY"){
		http.Error(w, "Incorrect API Key", http.StatusBadRequest)
		return
	}
	
	// Get the ID token sent by the client
	defer r.Body.Close()
	idToken, err := getIDTokenFromBody(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Utilize helper function to obtain id token from request body
	decoded, err := client.VerifyIDToken(r.Context(), idToken)
	if err != nil {
		log.Print("Invalid ID")
		http.Error(w, "Invalid ID token", http.StatusUnauthorized)
		return
	}

	// Check that auth_time parameter is accessible
	authTime, ok := decoded.Claims["auth_time"].(float64)
	if !ok {
		log.Print("Invalid auth_time")
		http.Error(w, "Invalid auth_time claim", http.StatusUnauthorized)
		return
	}

	// Check that token isn't expired, if so, return 401
	if time.Now().Unix()-int64(authTime) > 5*60 {
		log.Print("Recent sign in")
		http.Error(w, "Recent sign-in required", http.StatusUnauthorized)
		return
	}

	// Set expiration time for two weeks using firebase and create cookie to be set for user session
	expiresIn := time.Hour * 24 * 14
	cookie, err := client.SessionCookie(r.Context(), idToken, expiresIn)
	if err != nil {
		log.Print("Failed to create session cookie")
		http.Error(w, "Failed to create a session cookie", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
        "session":   cookie,
    })
}

func verifyToken(w http.ResponseWriter, r *http.Request) {
	// Get the ID token sent by the client
	cookie, err := r.Cookie("session")
	if err != nil {
		// Session cookie is unavailable. Force user to login.
		http.Redirect(w, r, "/sign-in", http.StatusFound)
		return
	}

	// Verify the session cookie. In this case an additional check is added to detect
	// if the user's Firebase session was revoked, user deleted/disabled, etc.
	decoded, err := client.VerifySessionCookieAndCheckRevoked(r.Context(), cookie.Value)
	if err != nil {
		// Session cookie is invalid. Force user to login.
		http.Redirect(w, r, "/sign-in", http.StatusFound)
		return
	}

	// decoded contains the verified user's claims
    uid := decoded.UID
    email := decoded.Claims["email"].(string)

	w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "uid":   uid,
        "email": email,
    })
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
	mux.HandleFunc("/api/auth/verifyToken", verifyToken)
	mux.HandleFunc("/api/auth/servePage", servePage)
	log.Print("Listening...")
	log.Fatal(http.ListenAndServe(":3001", corsMiddleware(mux)))
}